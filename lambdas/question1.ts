import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const pathParameters = event?.pathParameters;
    const movieId = pathParameters?.movieId ? pathParameters.movieId : undefined;
    const role = pathParameters?.role ? pathParameters.role : undefined;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    if (!role) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing role" }),
      };
    }

    // const input = {
    //   ExpressionAttributeValues: {
    //     :v1: {
    //       S: "No One You Know"
    //     }
    //   },
    //   KeyConditionExpression: "Artist = :v1",
    //   ProjectionExpression: "SongTitle",
    //   TableName: "Music"
    // };
        let commandInput: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
        };
        commandInput = {
            ...commandInput,
            IndexName: "movieId",
            KeyConditionExpression: "movieId = :movieId and role = :role ",
          };
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
