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
    const reviewDate = parameters?.reviewYear ? (parameters.reviewYear) : undefined;

    
    //const movieId = parseInt(queryParams.movieId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
   

//A FilterExpression does not allow key attributes. You cannot define a filter expression based on a partition key or a sort key.
//https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
//ReviewDate - String, e.g. "2023-10-20". So we will use begins with as I am assuming the reviewDate will always begin with the year

      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and begins_with(#reviewDate, :reviewDate)",
        
        
        ExpressionAttributeNames: { "#reviewDate": "reviewDate" },
        ExpressionAttributeValues: {
          ":m": movieId,
          ":reviewDate":reviewDate
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