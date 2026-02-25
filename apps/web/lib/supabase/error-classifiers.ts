type SupabaseQueryError = {
  code?: string;
  message?: string;
} | null;

export function isMissingRelationInSchemaCache(error: SupabaseQueryError) {
  if (!error) {
    return false;
  }

  if (error.code === "PGRST205") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return message.includes("could not find the table") || message.includes("schema cache");
}
