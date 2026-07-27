# The GCP project. Created only when a billing account is provided; otherwise the
# pre-existing project is adopted by reference via var.project_id.
resource "google_project" "default" {
  count = var.billing_account_id != "" ? 1 : 0

  provider        = google-beta
  project_id      = var.project_id
  name            = var.project_id
  billing_account = var.billing_account_id
}
