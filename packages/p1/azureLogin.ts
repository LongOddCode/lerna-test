/**
 * Azure Account extension will store refresh token by keytar. So this lib
 * will use OAuth2.0 password flow to get and store refresh token.
 */
import * as keytar from "keytar";
import * as axios from "axios";
import * as os from "os";
import { exit } from "process";

// the friendly service name to store secret in keytar
const serviceName = "VS Code Azure";
const accountName = "AzureCloud";
const scopes = [
  "https://management.core.windows.net/user_impersonation",
  "offline_access",
  "openid",
  "profile",
];
const clientID = "aebc6443-996d-45c2-90f0-388ff96faa56";
const grantType = "password";
const tenentID = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const baseURL = "https://login.microsoftonline.com";

async function azureLogin() {
  // Entry
  const username = process.argv[3];
  const password = process.argv[4];

  if (!username || !password) {
    console.error(
      `Please provide username and password, e.g.,${os.EOL}\t npx ts-node azureLogin.ts -- "username" "password"`
    );
    process.exit(-1);
  }

  const client: axios.AxiosInstance = axios.default.create({
    baseURL: baseURL,
    timeout: 1000 * 100,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = {
    client_id: clientID,
    scope: scopes.reduce((p: string, c: string, i: number) => {
      if (i == 0) {
        p = c;
      } else {
        p += ` ${c}`;
      }
      return p;
    }),
    username: username,
    password: password,
    grant_type: grantType,
  };

  const encodeForm = (data: any) => {
    return Object.keys(data)
      .map(
        (key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
      )
      .join("&");
  };

  client
    .post(`/${tenentID}/oauth2/v2.0/token`, encodeForm(data))
    .then((resp) => {
      keytar
        .setPassword(serviceName, accountName, resp.data["refresh_token"])
        .then(() => {
          console.log("Azure login Successfully!");
        })
        .catch((err) => {
          console.log(err);
          exit(1);
        });
    })
    .catch((err) => {
      console.log(err);
      exit(1);
    });
}

azureLogin().catch((err) => {
  console.log(err);
  process.exit(1);
});
