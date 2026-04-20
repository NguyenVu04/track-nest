package project.tracknest.criminalreports.configuration.objectstorage;

import java.io.InputStream;

public interface ObjectStorage {
    void uploadFile(String bucketName, String objectName, String ContentType, InputStream data);
    void deleteFile(String bucketName, String objectName);
    InputStream downloadFile(String bucketName, String objectName);
    void deleteFolder(String bucketName, String prefix);
    boolean fileExists(String bucketName, String objectName);
    void deleteFolder(String bucketName, String prefix);
}
