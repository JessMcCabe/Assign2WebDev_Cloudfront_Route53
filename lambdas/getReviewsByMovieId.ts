import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ReviewsByMinRatingQueryParams } from "../shared/types";
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
  schema.definitions["ReviewsByMinRatingQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    console.log("In try")
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    
    const queryParams = event.queryStringParameters
    

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };

    console.log("Query params printed:")
    console.log(queryParams)
    if(queryParams){
    const rating = parseInt(queryParams.minRating);
    
    //const movieId = parseInt(queryParams.movieId);
    
   
    //If we have query params then use them, if not, just use movieId path prameter
    if("minRating" in queryParams){
      console.log("In valid query params")
      commandInput = {
        ...commandInput,
        //IndexName: "ratingIdx",
        KeyConditionExpression: "movieId = :m",// and rating = :r",
        FilterExpression: "rating > :r",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": rating
        },
      };
    }

    }
    else{
      console.log("In else")
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
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