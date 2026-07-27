variable "project_id" {
  description = "The GCP project ID"
  type        = string
  nullable    = false
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "credentials_file_path" {
  description = "Path to the GCP service account JSON file"
  type        = string
  nullable    = false
}

variable "app_display_name" {
  type        = string
  description = "Display name for the Firebase Web App"
  nullable    = false
}

variable "billing_account_id" {
  type        = string
  default     = ""
  description = "GCP billing account ID - required for Identity Platform (auth methods). When non-empty, the project is created (otherwise the project must pre-exist)."
}

variable "oauth_support_email" {
  type        = string
  default     = null
  description = "Support email shown on OAuth consent screen (chiselhub spelling; prefer support_email - both kept for UNION, only support_email is wired in firebase_auth.tf)."
}

variable "enable_google_signin" {
  type        = bool
  description = "Enable Google Sign-In provider (auto-creates OAuth client via Identity Platform)"
  default     = false
}

variable "support_email" {
  type        = string
  description = "Support email for OAuth consent screen (required when enable_google_signin = true)"
  default     = null
}
