# ⚡ Quantiva 2.0 — Distributed AI-Driven Portfolio Analysis System

> *"If Quantiva 1.0 was a bright idea, Quantiva 2.0 is that idea with infrastructure, message queues, and caffeine."*

---

## 🧭 Overview

<p align="center">
<br/><br/>
  <img width="800" src="https://github.com/user-attachments/assets/bb56a3e8-1ead-4924-acf8-5a24325f263d" alt="Quantiva Overview Diagram 1"/>
  <br/><br/>
  <img width="800" src="https://github.com/user-attachments/assets/4f56c710-1c12-4c02-b0ae-975293d71bb3" alt="Quantiva Overview Diagram 2"/>
  <br/><br/>
  <img width="800" src="https://github.com/user-attachments/assets/2cfcb12d-7987-4d8d-94e2-1e1163ccf6cd" alt="Quantiva Overview Diagram 3"/>
  <br/><br/>
  <img width="800" src="https://github.com/user-attachments/assets/cae7e36b-de74-43d2-9fd1-1e563e2ec00f" alt="Quantiva Overview Diagram 4"/>
</p>

Quantiva 2.0 is the evolved version of [**Quantiva 1.0**](https://github.com/mdrayaanpasha/quantiva) — a system that initially focused on **geopolitical and regression-based market analysis** in a single-server setup.

This version scales that idea into a **multi-server distributed ecosystem**, combining:
- Multiple financial strategies  
- Real-time communication via **RabbitMQ**  
- **AI-driven geopolitical sentiment analysis** using Gemini API  

In short: it’s smarter, faster, modular — and occasionally sentient before Monday coffee.

---

## 🧩 System Architecture

Quantiva 2.0 is built as a **distributed, message-driven system**, where independent strategy servers communicate through **RabbitMQ**, aggregate results via a **Master Node**, and produce unified insights for portfolio analysis.

```mermaid
graph TD
    subgraph User
        UI(💻 React Frontend)
    end

    subgraph Master Node
        Master(Master Server)
        Cache[(Redis Cache)]
    end

    subgraph Message Queue
        MQ([RabbitMQ])
    end

    subgraph Strategy Servers
        S1(🧮 Regression Server)
        S2(📊 Momentum Server)
        S3(📉 Mean Reversion Server)
        S4(🌍 Geo-Politics Server)
    end

    subgraph AI
        AI_API(🤖 Gemini API)
    end

    subgraph Database
        DB[(PostgreSQL)]
    end

    UI -- HTTP Request --> Master
    Master -- Publishes Job --> MQ
    MQ -- Sends Tasks --> S1
    MQ -- Sends Tasks --> S2
    MQ -- Sends Tasks --> S3
    MQ -- Sends Tasks --> S4
    S1 --> DB
    S4 -- Calls --> AI_API
    S1 -- Pushes Result --> MQ
    S2 -- Pushes Result --> MQ
    S3 -- Pushes Result --> MQ
    S4 -- Pushes Result --> MQ
    MQ -- Sends Aggregated Results --> Master
    Master -- Stores --> Cache
    Master -- Returns Report --> UI
````

| Server                       | Function                                                           | Core Tech                |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------ |
| 🧮 **Regression Server**     | Performs linear regression analysis on historical price data       | Node.js, Prisma ORM      |
| 📊 **Momentum Server**       | Implements moving-average-based momentum trading                   | Node.js                  |
| 📉 **Mean Reversion Server** | Detects overbought/oversold signals                                | Node.js                  |
| 🌍 **Geo-Politics Server**   | Runs sentiment + geopolitical event analysis via Gemini            | Node.js, Axios           |
| 🧠 **Master Server**         | Aggregates all strategy results, caches data, sends unified output | Node.js, Redis, RabbitMQ |

Each module runs independently, communicates asynchronously, and reports to the **Master Server**, which finalizes investment recommendations.

---

## 🧠 Core Functionality

* Create and manage **user portfolios**
* Run **multi-strategy analysis** (regression, momentum, mean reversion, geopolitics)
* Integrate **AI-based sentiment reasoning** via Gemini
* Aggregate, interpret, and return results as a **final decision report**

---

## 🧰 Tech Stack

| Layer              | Technology        | Purpose                              |
| ------------------ | ----------------- | ------------------------------------ |
| **Frontend**       | React (JSX)       | Portfolio creation and visualization |
| **Backend**        | Node.js + Express | RESTful services and orchestration   |
| **ORM**            | Prisma            | Database access layer                |
| **Cache**          | Redis             | Data caching and message buffering   |
| **Message Broker** | RabbitMQ          | Inter-service communication          |
| **AI Engine**      | Gemini 2.0        | Real-time geopolitical reasoning     |
| **Database**       | PostgreSQL        | Persistent data storage              |

---

## ⚙️ How It Works

1. A user submits a **portfolio** through the frontend.
2. The **Master Server** publishes an analysis request to **RabbitMQ**.
3. Each **strategy server** (Regression, Momentum, etc.) independently:

   * Processes data
   * Calls the Gemini API if needed
   * Pushes results back into the queue
4. The **Master Server** aggregates all responses, caches them in **Redis**, and sends the final decision report to the frontend.

---

## 🧮 Example Output

```bash
📈 Gemini Decision Response:
AAPL: STRONG
TSLA: AVERAGE
AMZN: WEAK

🧩 Reasoning:
AAPL surged due to easing of export restrictions.
TSLA sentiment mixed following CEO media coverage.
AMZN weakened amid logistics and labor headwinds.
```

---

## 🚀 Key Improvements from Quantiva 1.0

| Feature        | v1.0                      | v2.0                               |
| -------------- | ------------------------- | ---------------------------------- |
| Architecture   | Single-server monolith    | Distributed multi-server model     |
| Strategies     | Geopolitical + Regression | Modular trading strategies         |
| Communication  | Internal calls            | Async queues (RabbitMQ)            |
| Caching        | None                      | Redis caching layer                |
| AI Integration | Basic Gemini API          | Prompt-driven, contextual analysis |
| Scalability    | Limited                   | Horizontally scalable per service  |

---

## 📦 Installation & Setup

```bash
# Clone the repo
git clone https://github.com/mdrayaanpasha/quantiva_2.0.git
cd quantiva_2.0

# Install dependencies
npm install

# Add your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the system
npm run start
```

Make sure **RabbitMQ** and **Redis** are running locally before starting the services.

---

## 🔍 Highlights for Reviewers

* Built a **multi-service distributed trading architecture**
* Integrated **Gemini AI** for real-time sentiment reasoning
* Optimized performance with **Redis caching** + **RabbitMQ** orchestration
* Modular, extensible strategy design for easy experimentation
* Frontend built in **React** for seamless portfolio visualization

> *Designed with precision, built with Node, debugged with caffeine.*

---

## 🧭 Future Roadmap

* [ ] Integrate LSTM-based price prediction
* [ ] Real-time WebSocket data streaming
* [ ] Add advanced analytics dashboard
* [ ] Expand sentiment sources (Reddit, X)
* [ ] Optional containerization for deployment

---

## 🧾 Related Project

> 🧮 **Quantiva 1.0** — [github.com/mdrayaanpasha/quantiva](https://github.com/mdrayaanpasha/quantiva)
> The original prototype: a simple, single-server system running regression and geopolitical analysis.
> Quantiva 2.0 builds on it with distributed architecture, real-time AI, and modular scalability.

---

## 🧑‍💻 Author

**[Rayaan Pasha](https://github.com/mdrayaanpasha)**
*Engineer • AI Enthusiast • Distributed Systems Nerd*

---

**Quantiva 2.0** — *where data meets design, and every server thinks it’s the smartest one.*

