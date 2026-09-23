import { createApp } from "@/app";
import { env } from "@/env";

createApp().then((app) => {
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${env.PORT}/graphql`);
  });
});
