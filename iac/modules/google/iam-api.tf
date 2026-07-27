# Enable the IAM API - prerequisite for the admin service account.
resource "google_project_service" "iam" {
  provider           = google-beta
  project            = var.project_id
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}
