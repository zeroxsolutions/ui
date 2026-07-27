provider "google-beta" {
  project     = var.project_id
  region      = var.region
  credentials = file(var.credentials_file_path)
}
