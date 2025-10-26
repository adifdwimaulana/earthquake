# 🌎 Earthquake API

**Earthquake API** is a **NestJS service** designed to ingest and expose recent earthquake data from the [USGS Earthquake API](https://earthquake.usgs.gov/).  

---

## 🧱 Local / Development Environment Setup

This project is **fully containerized** to ensure consistency across environment, leveraging AWS emulation with **LocalStack**.

**Tech Stack Overview:**
- **NestJS**
- **AWS DynamoDB**
- **AWS CDK (aws-cdk-local)**
- **LocalStack**
- **Docker Compose**

---

## 🚀 How To Run the Service

1. Clone the repository:
   ```bash
   git clone https://github.com/adifdwimaulana/earthquake.git
   cd earthquake
   ```

2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

   ```bash
   cd cdk && npm install
   ```

4. Start the containers:
   ```bash
   docker compose up
   ```

5. Access the API:
   - API Base URL → [http://localhost:3000](http://localhost:3000)
   - Swagger (OpenAPI) Docs → [http://localhost:3000/api](http://localhost:3000/api)

6. (Optional) Test with Postman:
   Import the provided `postman_collection.json` or use Swagger Docs.

---

## 📖 Overview

The **Earthquake API** relies on the official **USGS Earthquake feed** to keep an up-to-date record of seismic events. The ingestion system is optimized to be **idempotent**, **fault-tolerant**, and **cost-efficient**.

### Key Features and Enhancements

1. **Incremental Fetching**  
   Ingests only *new* records from USGS using the **latest timestamp**, avoiding unnecessary overwrites of existing data.

2. **Scheduled Fetching**  
   A scheduler ensures consistent data refresh and prevents ingestion gaps caused by API delays or network issues.

3. **Batch Retry with Backoff**  
   Implements a retry mechanism with exponential backoff for DynamoDB `UnprocessedItems`, improving ingestion reliability.

---

## 🗂 Schema Design

### Earthquake Table

| Type | Name                     | Partition Key | Sort Key  |
|------|---------------------------|----------------|-----------|
| PK   | —                         | `eventId`      | —         |
| GSI  | GSI_TIME                 | `globalTime`   | `time`    |
| GSI  | GSI_MAGNITUDE            | `globalMag`    | `magScaled` |
| GSI  | GSI_LOCATION_MAGNITUDE   | `location`     | `magScaled` |
| GSI  | GSI_TSUNAMI_TIME         | `tsunami`      | `time`    |

---

### Log Table

| Type | Name                        | Partition Key | Sort Key   |
|------|-----------------------------|----------------|------------|
| PK   | —                           | `requestLogId` | —          |
| GSI  | GSI_DayBucket_Endpoint      | `dayBucket`    | `endpoint` |
| GSI  | GSI_MonthBucket_Magnitude   | `monthBucket`  | `magScaled` |

### Design Consideration

- **Global Secondary Indexes (GSIs)** enable flexible query combinations such as:
  - Fetching by `time`
  - Fetching by `location` + `magnitude`
  - Fetching by `magnitude`
  - Fetching by `location`
  - Fetching by `isTsunami` + `time`
- **Composite keys** (e.g., `location#magnitude`) minimize query cost and allow precise access patterns.  
- **Day/Month buckets** in log table enable **time-based analytics** such as total requests, response latency distribution, and endpoint popularity.

---

## ⚠️ Error Handling

### 1. BatchWrite UnprocessedItems
When DynamoDB returns `UnprocessedItems`, the service retries using a **backoff algorithm** to prevent partition throttling.

### 2. Custom Filter Exception
Introduces a custom `ForbiddenFilterException` to inform users with **valid filter combinations**.

---

## ⚙️ Scalability Plan (Handling 500 RPS)

To handle 500 RPS, it is a case by case scenario depends on which endpoint experienced high traffic:

### Scenario 1 — High Read Traffic (`/earthquakes/:eventId`)
- GET earthquakes by eventId data is rarely changed, so we can introduce caching with a short ttl (10 minutes). 
- Invalidate cache if `/earthquakes/ingest` is called.

### Scenario 2 — High Write or Query Traffic (`/earthquakes`, `/earthquake/ingest`)
- **Avoid Hot Partitions:** Implement **sharded GSI partition keys** (e.g., `region#shardId`) to distribute write load.
- **Auto Scaling:** Enable **DynamoDB auto scaling** and container horizontal scaling based on `memoryUsage` threshold.
- **Async Processing:** Decouple ingestion process by designing an asynchronous API using AWS SQS + Lambda.

---

## 🧪 Testing Strategy

Current test coverage includes:
- ✅ **Unit Tests** for core logic and services.

Planned future enhancements:
- 🔄 **Integration Tests:**  
  Using LocalStack to simulate AWS resources in CI.
- 💥 **Load Tests:**  
  Implemented with **k6** to evaluate system performance at scale before production rollout.

---

## 📊 Monitoring & Observability (Future Plan)

If extended, the next steps include:
- **AWS CloudWatch:** Real-time metrics for ingestion latency, batch retries, and API response times.
- **Structured Logging:** Centralized logging for analytics and troubleshooting.
- **Alerting Rules:** Automated alerts for failed ingestions or DynamoDB throttling events.

---

## 🧠 DynamoDB Design Thought Process

I have spent most of the development time at this step, because I need to design the access pattern upfront. I have several times revisit the index structure to adjust with the API's access pattern.

- Decide what query or parameters that could be used as filter
- Decide the table's structure (partition key and sort key)
- Decide the index structure. Since I use, eventId and uuid as the PK then I only use GSI in this project.

---
