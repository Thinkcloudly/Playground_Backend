docker build -t playground-backend . --platform linux/amd64     
docker image rm 071688540161.dkr.ecr.us-east-1.amazonaws.com/playground-backend:latest  
docker tag playground-backend:latest 071688540161.dkr.ecr.us-east-1.amazonaws.com/playground-backend:latest
docker push 071688540161.dkr.ecr.us-east-1.amazonaws.com/playground-backend:latest