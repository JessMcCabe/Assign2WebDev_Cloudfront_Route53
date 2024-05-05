import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ReviewsByMovieIdQueryParams } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";


import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["ReviewsByMovieIdYearQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerName = parameters?.reviewerName ? (parameters.reviewerName) : undefined;

    
    //const movieId = parseInt(queryParams.movieId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
   


      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        FilterExpression: "#reviewerName = :reviewerName",
        
        ExpressionAttributeNames: { "#reviewerName": "reviewerName" },
        ExpressionAttributeValues: {
          ":m": movieId,
          ":reviewerName":reviewerName
        },
        
        
      };
    
    
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );
      
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: commandOutput.Items,
        }),
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
  
  function createDocumentClient() {
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