import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ReviewsTranslation } from "../shared/types";
import * as AWS from 'aws-sdk';
import { Translate } from 'aws-sdk';


import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";


import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["ReviewsTranslation"] || {}
);

const translate = new AWS.Translate();

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const reviewerName = parameters?.reviewerName ? parameters.reviewerName : undefined;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    
    
    const queryParams = event.queryStringParameters

    if (!queryParams) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }
    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Query parameters schema`,
          schema: schema.definitions["ReviewsTranslation"],
        }),
      };
    }
     const language = queryParams.language ? queryParams.language: 'en' 

    if (!reviewerName) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing reviewer name" }),
      };
    }
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
   
      commandInput = {
        ...commandInput,
        IndexName: "rvrName",
        KeyConditionExpression: "reviewerName = :m",
        FilterExpression: "#movieId = :movieId",
        
        ExpressionAttributeNames: { "#movieId": "movieId" },
        ExpressionAttributeValues: {
          ":m": reviewerName,
          ":movieId": movieId
        },
      };
    
    
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );


      if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid reviewer name" }),
      };
    }
    console.log("Logging text")

    //Based on spec assumption that A reviewer will never review a movie more than once
const text = commandOutput.Items[0]['content']
console.log(text)
    const translateParams: Translate.Types.TranslateTextRequest = {
      Text: text,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
  };
  console.log("Call Translation:")
  const translatedMessage = await translate.translateText(translateParams).promise();
  console.log("Translated Message below:")
  console.log(translatedMessage['TranslatedText'])
  commandOutput.Items[0]['content'] = translatedMessage['TranslatedText']

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: commandOutput.Items,
        }),
      };
    } 
    
    
    catch (error: any) {
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