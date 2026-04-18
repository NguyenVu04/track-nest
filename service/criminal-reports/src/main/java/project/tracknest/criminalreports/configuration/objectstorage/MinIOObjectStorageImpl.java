package project.tracknest.criminalreports.configuration.objectstorage;

import io.minio.*;
import io.minio.messages.DeleteError;
import io.minio.messages.DeleteObject;
import io.minio.messages.Item;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MinIOObjectStorageImpl implements ObjectStorage {
    public static final String BUCKET_NAME = "criminal-reports";

    private final MinioClient client;

    public MinIOObjectStorageImpl(MinioClient client) {
        this.client = client;
        try {
            boolean bucketExists = client.bucketExists(BucketExistsArgs.builder()
                    .bucket(BUCKET_NAME)
                    .build());
            if (!bucketExists) {
                client.makeBucket(MakeBucketArgs.builder()
                        .bucket(BUCKET_NAME)
                        .build());
                log.info("Bucket created: {}", BUCKET_NAME);
            } else {
                log.info("Bucket already exists: {}", BUCKET_NAME);
            }
        } catch (Exception e) {
            log.error("Error checking/creating bucket in MinIO: ", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void uploadFile(
            String bucketName,
            String objectName,
            String ContentType,
            InputStream data) {
        try {
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(data, data.available(), -1)
                    .contentType(ContentType)
                    .build());
            log.info("File uploaded successfully to MinIO: {}/{}", bucketName, objectName);
        } catch (Exception e) {
            log.error("Error uploading file to MinIO: ", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteFile(String bucketName, String objectName) {
        try {
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            log.info("File deleted successfully from MinIO: {}/{}", bucketName, objectName);
        } catch (Exception e) {
            log.error("Error deleting file from MinIO: ", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public InputStream downloadFile(String bucketName, String objectName) {
        try {
            GetObjectResponse response = client.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            log.info("File downloaded successfully from MinIO: {}/{}", bucketName, objectName);
            return response;
        } catch (Exception e) {
            log.error("Error downloading file from MinIO: ", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteFolder(String bucketName, String prefix) {
        try {
            Iterable<Result<Item>> objects = client.listObjects(ListObjectsArgs.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .recursive(true)
                    .build());

            List<DeleteObject> toDelete = new ArrayList<>();
            for (Result<Item> result : objects) {
                toDelete.add(new DeleteObject(result.get().objectName()));
            }

            if (toDelete.isEmpty()) {
                return;
            }

            Iterable<Result<DeleteError>> errors = client.removeObjects(RemoveObjectsArgs.builder()
                    .bucket(bucketName)
                    .objects(toDelete)
                    .build());

            for (Result<DeleteError> error : errors) {
                log.error("Error deleting object in folder {}: {}", prefix, error.get().message());
            }

            log.info("Folder deleted from MinIO: {}/{}", bucketName, prefix);
        } catch (Exception e) {
            log.error("Error deleting folder from MinIO: ", e);
            throw new RuntimeException(e);
        }
    }
}
