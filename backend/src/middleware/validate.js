function fail(res, issues) {
  return res.status(400).json({
    error: "Validation failed",
    details: issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return fail(res, result.error.issues);
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return fail(res, result.error.issues);
    res.locals.query = result.data;
    next();
  };
}
