import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Service from "@/models/Service";
import User from "@/models/User";
import mongoose from "mongoose";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

const fetchServiceNameMap = async (workspaceId, identifiers = []) => {
  if (!workspaceId) {
    return {};
  }

  const uniqueIdentifiers = Array.from(
    new Set(
      (identifiers || [])
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
    )
  );

  if (uniqueIdentifiers.length === 0) {
    return {};
  }

  const objectIdValues = [];
  uniqueIdentifiers.forEach((value) => {
    if (mongoose.Types.ObjectId.isValid(value)) {
      objectIdValues.push(new mongoose.Types.ObjectId(value));
    }
  });

  const orConditions = [];
  if (objectIdValues.length > 0) {
    orConditions.push({ _id: { $in: objectIdValues } });
  }

  orConditions.push({ id: { $in: uniqueIdentifiers } });

  const services = await Service.find({
    workspaceId,
    $or: orConditions,
  })
    .select("_id id serviceName")
    .lean();

  const serviceNameMap = {};

  services.forEach((service) => {
    if (!service) return;
    if (service._id) {
      serviceNameMap[String(service._id)] = service.serviceName;
    }
    if (service.id) {
      serviceNameMap[String(service.id)] = service.serviceName;
    }
  });

  return serviceNameMap;
};

const enrichLogsWithServiceNames = async (workspaceId, logs = []) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return logs;
  }

  const serviceIdentifiers = new Set();

  logs.forEach((log) => {
    if (!Array.isArray(log?.details)) {
      return;
    }

    log.details.forEach((detail) => {
      if (detail?.field !== "serviceId") {
        return;
      }

      if (detail.previousValue != null && detail.previousValue !== "") {
        serviceIdentifiers.add(String(detail.previousValue));
      }

      if (detail.newValue != null && detail.newValue !== "") {
        serviceIdentifiers.add(String(detail.newValue));
      }
    });
  });

  if (serviceIdentifiers.size === 0) {
    return logs;
  }

  const serviceNameMap = await fetchServiceNameMap(
    workspaceId,
    Array.from(serviceIdentifiers)
  );

  if (!serviceNameMap || Object.keys(serviceNameMap).length === 0) {
    return logs;
  }

  return logs.map((log) => {
    if (!Array.isArray(log?.details)) {
      return log;
    }

    const mappedDetails = log.details.map((detail) => {
      if (!detail || detail.field !== "serviceId") {
        return detail;
      }

      const mapValue = (rawValue) => {
        if (rawValue == null) {
          return rawValue;
        }
        const key = String(rawValue).trim();
        if (!key) {
          return rawValue;
        }
        return serviceNameMap[key] ?? rawValue;
      };

      return {
        ...detail,
        previousValue: mapValue(detail.previousValue),
        newValue: mapValue(detail.newValue),
      };
    });

    return {
      ...log,
      details: mappedDetails,
    };
  });
};

// GET /api/projects/[id] - Get a single project
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);

    const filter = { _id: id };
    if (authUser?.workspaceId) {
      filter.workspaceId = authUser.workspaceId;
    }

    const project = await Project.findOne(filter);

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    const projectResponse = project.toObject();
    if (Array.isArray(projectResponse.logs)) {
      projectResponse.logs.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      projectResponse.logs = await enrichLogsWithServiceNames(
        authUser?.workspaceId,
        projectResponse.logs
      );
    }

    return successResponse(
      { project: projectResponse },
      "Project fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return errorResponse("Failed to fetch project", 500);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const projectData = await request.json();
    const existingProject = await Project.findOne({
      _id: id,
      workspaceId: authUser.workspaceId,
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    const actor = await User.findById(authUser.userId).lean();
    const actorName = actor?.fullName || "Team Member";
    const actorEmail = actor?.email || "";

    const serviceIdentifiers = [];
    if (existingProject.serviceId) {
      serviceIdentifiers.push(existingProject.serviceId);
    }
    if (projectData.serviceId) {
      serviceIdentifiers.push(projectData.serviceId);
    }

    const serviceNameMap = await fetchServiceNameMap(
      authUser.workspaceId,
      serviceIdentifiers
    );

    const fieldConfigs = {
      projectName: { label: "Project name", type: "text" },
      brief: { label: "Project brief", type: "richtext" },
      clientName: { label: "Client name", type: "text" },
      clientPhone: { label: "Client phone", type: "text" },
      deadline: { label: "Due date", type: "datetime" },
      price: { label: "Price", type: "currency" },
      quantity: { label: "Quantity", type: "number" },
      discount: { label: "Discount", type: "currency" },
      totalPrice: { label: "Total price", type: "currency" },
      deliverables: { label: "Deliverables link", type: "text" },
      invoice: { label: "Invoice", type: "text" },
      serviceId: { label: "Service", type: "text" },
      numberOrder: { label: "Order number", type: "text" },
    };

    const numericFields = ["price", "discount", "totalPrice"];
    const integerFields = ["quantity"];

    const normalizeValue = (field, value) => {
      if (value === undefined || value === null) return "";
      if (field === "deadline") {
        const dateValue = new Date(value);
        return Number.isNaN(dateValue.getTime())
          ? ""
          : dateValue.getTime();
      }
      if (numericFields.includes(field) || integerFields.includes(field)) {
        const numericValue = Number(value);
        return Number.isNaN(numericValue) ? 0 : numericValue;
      }
      if (field === "serviceId") {
        return String(value || "").trim();
      }
      return String(value ?? "").trim();
    };

    const stripHtml = (input) => {
      if (!input) return "";
      return String(input)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const formatDetailValue = (field, value, type) => {
      if (value === undefined || value === null) return "";
      if (field === "serviceId") {
        const key = String(value).trim();
        if (!key) {
          return "";
        }
        return serviceNameMap[key] ?? key;
      }
      if (type === "datetime") {
        const dateValue = new Date(value);
        return Number.isNaN(dateValue.getTime())
          ? ""
          : dateValue.toISOString();
      }
      if (type === "currency" || type === "number") {
        const numericValue = Number(value);
        return Number.isNaN(numericValue) ? 0 : numericValue;
      }
      if (type === "richtext") {
        return stripHtml(value);
      }
      return String(value).trim();
    };

    const changeDetails = [];
    Object.entries(fieldConfigs).forEach(([field, config]) => {
      if (!(field in projectData)) {
        return;
      }
      const currentValue = normalizeValue(field, existingProject[field]);
      const nextValue = normalizeValue(field, projectData[field]);

      if (currentValue === nextValue) {
        return;
      }

      changeDetails.push({
        field,
        label: config.label,
        valueType: config.type,
        previousValue: formatDetailValue(field, existingProject[field], config.type),
        newValue: formatDetailValue(field, projectData[field], config.type),
      });
    });

    const statusChanged =
      "status" in projectData &&
      String(projectData.status).toLowerCase() !==
        String(existingProject.status || "").toLowerCase();

    const statusLabels = {
      "to do": "To Do",
      "in progress": "In Progress",
      "waiting for payment": "Waiting for Payment",
      "in review": "In Review",
      revision: "Revision",
      done: "Done",
    };

    const logsToAdd = [];
    const now = new Date();

    if (statusChanged) {
      const statusValue = String(projectData.status).toLowerCase();
      logsToAdd.push({
        type: "status_change",
        message: `Status change to ${
          statusLabels[statusValue] || projectData.status
        }`,
        status: projectData.status,
        actorId: authUser.userId,
        actorName,
        actorEmail,
        createdAt: now,
      });
    }

    const nonStatusDetails = changeDetails.filter(
      (detail) => detail.field !== "status"
    );

    if (nonStatusDetails.length > 0) {
      logsToAdd.push({
        type: "project_edit",
        message: "Project Edited",
        details: nonStatusDetails,
        actorId: authUser.userId,
        actorName,
        actorEmail,
        createdAt: now,
      });
    }

    const allowedFields = [
      "numberOrder",
      "projectName",
      "clientName",
      "clientPhone",
      "deadline",
      "brief",
      "price",
      "quantity",
      "discount",
      "totalPrice",
      "deliverables",
      "invoice",
      "serviceId",
      "status",
      "workspaceId",
    ];

    const updateSet = { workspaceId: authUser.workspaceId };

    allowedFields.forEach((field) => {
      if (!(field in projectData)) {
        return;
      }

      if (field === "deadline") {
        updateSet.deadline = projectData.deadline
          ? new Date(projectData.deadline)
          : null;
        return;
      }

      if (numericFields.includes(field)) {
        const numericValue = Number(projectData[field]);
        updateSet[field] = Number.isNaN(numericValue) ? 0 : numericValue;
        return;
      }

      if (integerFields.includes(field)) {
        const intValue = parseInt(projectData[field], 10);
        updateSet[field] = Number.isNaN(intValue) ? 0 : intValue;
        return;
      }

      updateSet[field] = projectData[field];
    });

    updateSet.updatedAt = now;

    const updateOperations = {
      $set: updateSet,
    };

    if (logsToAdd.length > 0) {
      updateOperations.$push = {
        logs: {
          $each: logsToAdd,
          $position: 0,
        },
      };
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, workspaceId: authUser.workspaceId },
      updateOperations,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProject) {
      return errorResponse("Project not found", 404);
    }

    const projectResponse = updatedProject.toObject();
    if (Array.isArray(projectResponse.logs)) {
      projectResponse.logs.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      projectResponse.logs = await enrichLogsWithServiceNames(
        authUser.workspaceId,
        projectResponse.logs
      );
    }

    return successResponse(
      { project: projectResponse },
      "Project updated successfully"
    );
  } catch (error) {
    console.error("Error updating project:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(`A project with this ${field} already exists`, 400);
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return errorResponse(
        `Validation failed: ${validationErrors.join(", ")}`,
        400
      );
    }

    return errorResponse("Failed to update project", 500);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const deletedProject = await Project.findOneAndDelete({
      _id: id,
      workspaceId: authUser.workspaceId,
    });

    if (!deletedProject) {
      return errorResponse("Project not found", 404);
    }

    return successResponse(
      { project: deletedProject },
      "Project deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return errorResponse("Failed to delete project", 500);
  }
}
