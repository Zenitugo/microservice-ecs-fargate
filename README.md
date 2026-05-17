# DEPLOYMENT OF A MICROSERVICE APPLICATION ON ECS FARGATE

## 📖 Overview

A production-grade microservices application deployed on AWS ECS Fargate using Infrastructure as Code with CloudFormation. The application is a backend that handles user management, product catalogue, order processing and notifications. When a user places an order, a message is published to an SQS queue which triggers the notification service to confirm the order.

The entire infrastructure is defined as code across 13 CloudFormation stacks and deployed automatically through a GitHub Actions CI/CD pipeline.

---

## 🚀 Features

- Four containerised microservices running on AWS ECS Fargate
- Infrastructure as Code using AWS CloudFormation (13 stacks)
- Automated CI/CD pipeline with GitHub Actions
- Asynchronous order processing using Amazon SQS
- Separate PostgreSQL RDS instance per service
- Secrets managed through AWS Secrets Manager
- Full observability stack: CloudWatch Logs, Metrics, Alarms, Container Insights and X-Ray
- Bash deploy and destroy scripts for full lifecycle management
- Dead Letter Queue for failed order notifications

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Cloud Provider | AWS |
| Container Platform | ECS Fargate |
| Infrastructure as Code | AWS CloudFormation |
| CI/CD | GitHub Actions |
| Container Registry | Amazon ECR |
| Database | Amazon RDS PostgreSQL |
| Message Queue | Amazon SQS |
| Secrets Management | AWS Secrets Manager |
| Service Discovery  | AWS Cloud Map
| Load Balancer | Application Load Balancer |
| Logging | Amazon CloudWatch Logs |
| Metrics | Amazon CloudWatch Metrics + Container Insights |
| Monitoring | Amazon CloudWatch Alarms |
| Tracing | AWS X-Ray |
| Runtime | Node.js |
| Containerisation | Docker |

---

## 🏗 Architecture

```
App
    ↓
Application Load Balancer (public subnet)
    ├── /users/*     → User Service    (private subnet, port 3001)
    ├── /products/*  → Product Service (private subnet, port 3002)
    └── /orders/*    → Order Service   (private subnet, port 3003)
                            ↓
                       SQS Queue
                            ↓
                  Notification Service (private subnet, 3004)

Each service has its own RDS PostgreSQL instance:
User Service    → users-db
Product Service → products-db
Order Service   → orders-db
```

---

## 📁 Repo Structure

```
microservice-ecs-fargate/
├── README.md
├── app
│   ├── compose.yml
│   ├── notification-service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src
│   │       ├── consumer.js
│   │       └── index.js
│   ├── order-service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src
│   │       ├── db.js
│   │       ├── index.js
│   │       ├── routes.js
│   │       └── sqs.js
│   ├── product-service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src
│   │       ├── db.js
│   │       ├── index.js
│   │       └── routes.js
│   └── user-service
│       ├── Dockerfile
│       ├── package.json
│       └── src
│           ├── db.js
│           ├── index.js
│           └── routes.js
└── cf-scripts
    ├── alarms.yaml
    ├── deploy.sh
    ├── deploy2.sh
    ├── destroy.sh
    ├── ecr.yaml
    ├── ecs.yaml
    ├── iam.yaml
    ├── insights.yaml
    ├── lb.yaml
    ├── logging.yaml
    ├── network.yaml
    ├── rds.yaml
    |── service-discovery.yaml
    ├── sg.yaml
    ├── sqs.yaml
    └── xrays.yaml


```

---

## ⚙️ Setup Instructions

### Prerequisites

- AWS account with appropriate permissions
- AWS CLI configured locally
- Docker installed
- GitHub repository with the following secrets configured:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCOUNT_ID
```

### Deploy via GitHub Actions (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/your-username/microservice-ecs-fargate.git
cd microservice-ecs-fargate
```

2. Push to master branch to trigger the pipeline:
```bash
git push origin master
```

The pipeline will automatically:
- Deploy all 12 CloudFormation stacks in the correct order
- Build and push Docker images to ECR
- Deploy ECS services

## 🧪 Testing the Application

Once the infrastructure is deployed and services are running,
you can test the application using curl or Postman.

Replace `YOUR_ALB_DNS` with your actual ALB DNS name from the
AWS Console under EC2 → Load Balancers.

### Health Checks
```bash
curl http://YOUR_ALB_DNS/health
```

### User Service

**Create a user**
```bash
curl -X POST http://YOUR_ALB_DNS/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

**Get a user**
```bash
curl http://YOUR_ALB_DNS/users/1
```

### Product Service

**Create a product**
```bash
curl -X POST http://YOUR_ALB_DNS/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Nike Air Max", "price": 150, "description": "Running shoes"}'
```

**Get all products**
```bash
curl http://YOUR_ALB_DNS/products
```

### Order Service

**Place an order**
```bash
curl -X POST http://YOUR_ALB_DNS/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "productId": 1, "quantity": 2}'
```

**Get an order**
```bash
curl http://YOUR_ALB_DNS/orders/1
```

### Destroy Infrastructure

```bash
# Via GitHub Actions - go to Actions tab, select Destroy workflow, run manually
```

---

## Screenshots
### Users created on the terminal
<img width="1920" height="320" alt="users" src="https://github.com/user-attachments/assets/07728805-2e53-4fbe-8ef6-2508b18491d9" />
### All users on the browser
<img width="1920" height="179" alt="users2" src="https://github.com/user-attachments/assets/195c0dcc-4949-4e69-bd34-f238604b29b1" />
### Products created on the terminal
<img width="1920" height="444" alt="products" src="https://github.com/user-attachments/assets/192751f9-9144-4c57-8300-20b0ba7f2669" />
### All products on the browser
<img width="1920" height="206" alt="users1" src="https://github.com/user-attachments/assets/bacdf4d2-3b33-46e4-9f7f-86c59f5c7e40" />
### Orders created on the terminal
<img width="1920" height="285" alt="orders" src="https://github.com/user-attachments/assets/18f05ba8-7ee1-490d-a47e-1368bb1ac59e" />
### All orders on the browser
<img width="1920" height="265" alt="orders2" src="https://github.com/user-attachments/assets/066ea3a0-e489-4f35-a3d4-d6cf0cfe6cdb" />

## 👤 Author
Your name
AWS Builders Community Programme - Containers Track

---
