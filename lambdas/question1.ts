import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import schema from "../shared/types.schema.json";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
      console.log("[EVENT]", JSON.stringify(event));
      const queryParams = event.queryStringParameters;
      if (!queryParams) {
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: "Missing query parameters" }),
        };
      }
      var isVerbose = false
      if ("verbose" in queryParams) {
        const verbose = (queryParams.verbose);
        if (verbose === "true") {
          isVerbose = true
        } else isVerbose = false
      }

        let commandInput: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
        };
        if (!isVerbose) {
          commandInput = {
            ...commandInput,
            IndexName: "movieId",
            KeyConditionExpression: "movieId = :movieId and role = :role ",
          };
        } else {
          commandInput = {
            ...commandInput,
            IndexName: "movieId",
            KeyConditionExpression: "movieId = :movieId",
          };
        }
              const commandOutput = await client.send(
                new QueryCommand(commandInput)
              );
        
    console.log("GetCommand response: ", commandOutput);
    if (!commandOutput) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }
    const body = {
      data: commandOutput.Items,
    };

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({data: commandOutput.Items,}),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
