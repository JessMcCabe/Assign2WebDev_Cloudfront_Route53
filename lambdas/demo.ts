import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2  = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", JSON.stringify(event  )  );
    return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify( {message: 'Success in contacting endpoint'}  ),
      };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};
