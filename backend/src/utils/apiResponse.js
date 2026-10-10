/**
 * Standardized API Response Helper for NexCart
 */

class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
    };

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  static created(res, { message = 'Resource created successfully', data = null }) {
    return this.success(res, { statusCode: 201, message, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
