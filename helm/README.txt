kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -
helm install track-nest . --namespace dev
docker pull docker.io/library/busybox:1.28