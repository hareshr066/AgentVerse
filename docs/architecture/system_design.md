# ManuSphere AI - System Architecture

## Architecture Topology
The platform is a multi-agent system coordinating real-time events, inventory status, production planning, and generative AI feedback using a hub-and-spoke model controlled by the **Orchestrator Gateway**.

```
                           +----------------------+
                           |  React Vite Frontend |
                           +----------+-----------+
                                      |
                                      v
                           +----------+-----------+
                           |  Orchestrator Gateway|
                           +----------+-----------+
                                      |
       +------------------+-----------+-----------+--------------------+
       |                  |                       |                    |
+------v-------+   +------v-------+       +-------v------+      +------v-------+
| Event Agent  |   | Demand Agent |       | Inventory Ag |      | Production Ag|
+--------------+   +--------------+       +--------------+      +--------------+
       |                  |                       |                    |
       +------------------+-----------+-----------+--------------------+
                                      |
                           +----------v-----------+
                           | Recommendation Agent |
                           |    (Gemini AI)       |
                           +----------------------+
```

## Database
We use a shared PostgreSQL instance for system-wide transaction logging, alongside Redis as a message broker/cache.
