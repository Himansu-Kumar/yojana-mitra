/** Validates req[source] with a zod schema and replaces it with the parsed value. */
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const parsed = schema.parse(req[source]);
    if (source === "query") {
      // req.query is a getter in Express 5, so store the parsed copy separately
      req.validatedQuery = parsed;
    } else {
      req[source] = parsed;
    }
    next();
  };
