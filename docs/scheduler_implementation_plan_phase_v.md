# Wix Velo Scheduler: Implementation Plan - Phase V: Data Normalization Strategy

To aggregate data from multiple sources, all external appointments will be mapped to a single **canonical appointment object**.

```javascript
{
  "id": "string", // Internal Wix DB ID
  "sourceSystem": "Zocdoc | Kareo | SimplePractice | Google | Athenahealth",
  "externalId": "string", // ID from the source system
  "providerId": "string",
  "patientId": "string", // May be pseudonymized for HIPAA compliance
  "therapistId": "string",
  "startDateTime": "ISO-8601", // Normalized to UTC
  "endDateTime": "ISO-8601",   // Normalized to UTC
  "location": "string",
  "status": "Scheduled | Confirmed | Cancelled | Completed",
  "type": "Consult | Follow-up | Admin | Personal",
  "conflictIds": ["array", "of", "conflicting", "appointment", "IDs"],
  "metadata": {} // Raw JSON from source for audit/reference
}
```

**Key Principles:**
-   All timezone information will be normalized to UTC on ingest and converted to local time for display.
-   Transformer functions will be implemented in each API module to handle the mapping.
-   Raw metadata from the source system will always be stored for auditing and fallback purposes.
