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
    let route =""

    
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewer_year_num = parameters?.reviewerName ? parseInt(parameters.reviewerName) : "";
    

    //https://stackoverflow.com/questions/23437476/in-typescript-how-to-check-if-a-string-is-numeric
    function isNumeric(val: unknown): val is string | number {
      return (
        !isNaN(Number(Number.parseFloat(String(val)))) &&
        isFinite(Number(val))
      );
    }
    


    //const movieId = parseInt(queryParams.movieId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };

    if(isNumeric(reviewer_year_num)){
      const reviewDate = parameters?.reviewerName ? (parameters.reviewerName) : undefined;
      route = "reviewDate"
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and begins_with(#reviewDate, :reviewDate)",
        
        
        ExpressionAttributeNames: { "#reviewDate": "reviewDate" },
        ExpressionAttributeValues: {
          ":m": movieId,
          ":reviewDate":reviewDate
        },
        
        
      };
      }
      if(!isNumeric(reviewer_year_num))
      {
      const reviewerName = parameters?.reviewerName ? (parameters.reviewerName) : undefined;
      route = "reviewerName"
      console.log(reviewerName)
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
      }
   
    
    
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