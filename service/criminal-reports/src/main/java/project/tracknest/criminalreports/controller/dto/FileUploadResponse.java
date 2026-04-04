package project.tracknest.criminalreports.controller.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FileUploadResponse {
    
    private String filename;
    
    @JsonProperty("url")
    private String publicUrl;
    
    private String contentType;
    
    private long size;

    public FileUploadResponse() {
    }

    public FileUploadResponse(String filename, String publicUrl, String contentType, long size) {
        this.filename = filename;
        this.publicUrl = publicUrl;
        this.contentType = contentType;
        this.size = size;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}