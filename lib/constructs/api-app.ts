import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
// import { LambdaIntegration, RestApi, Cors } from "aws-cdk-lib/aws-apigateway";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { generateBatch } from "../../shared/util";
import {movieReview} from "../../seed/movieReview";
import {favouriteMovie} from "../../seed/favouriteMovies";

interface APIAppProps {
  userPoolId: string;
  userPoolClientId: string;

}

export class APIApp extends Construct {
  public readonly apiUrl: string;
  private userPoolId: string;
  private userPoolClientId: string;

  constructor(scope: Construct, id:string, props: APIAppProps) {
    super(scope, id);
    ({ userPoolId: this.userPoolId, userPoolClientId: this.userPoolClientId } =
      props);

    // Lambdas
    const demoFn = new NodejsFunction(this, "RESTEndpointFn", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_18_X,
      entry: `${__dirname}/../../lambdas/demo.ts`,
      timeout: Duration.seconds(10),
      memorySize: 128,
    });

    // REST API
    const api = new apig.RestApi(this, "DemoAPI", {
      description: "example api gateway",
      endpointTypes: [apig.EndpointType.REGIONAL],
      deployOptions: {
        stageName: "dev",
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: [ "*" ],
      },
    });


     //Table
     const movieReviewsTable = new dynamodb.Table(this, "movieReviews", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: {name: "reviewDate", type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "movieReviews",
    });
    movieReviewsTable.addGlobalSecondaryIndex({
      indexName: "rvrName",
      partitionKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
    });




    const favouriteMoviesTable = new dynamodb.Table(this, "favouriteMovies", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "favouriteMovies",
    });


    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: this.userPoolId,
        CLIENT_ID: this.userPoolClientId,
        REGION: cdk.Aws.REGION,
        TABLE_NAME: movieReviewsTable.tableName,
        TABLE_NAME_FAV_MOV: favouriteMoviesTable.tableName,
        
      },
     
    };

    new custom.AwsCustomResource(this, "movieReviewsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReview),
            [favouriteMoviesTable.tableName]: generateBatch(favouriteMovie),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("movieReviewsddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn,favouriteMoviesTable.tableArn, ],
        
      }),
    });


    const todoEndpoint = api.root.addResource("todos")
    todoEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(demoFn, { proxy: true }) // AWSIntegration
    );

    this.apiUrl = api.url;
 
    

    const getReviewsByMovieIdFn = new node.NodejsFunction(this, "GetReviewsByMovieIdFn",{
      ...appCommonFnProps,
        entry: `${__dirname}/../../lambdas/getReviewsByMovieId.ts`,
        
      }
      );

      const getReviewByReviewerNameFn = new node.NodejsFunction(this, "GetReviewByReviewerNameFn",{
        ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/getReviewByReviewerName.ts`,
        }
        );


        const newMovieReviewFn = new node.NodejsFunction(this,  "AddMovieReviewFn", {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/addMovieReview.ts`,
         
        });


        const newFavouriteMovieFn = new node.NodejsFunction(this,  "AddFavouriteMovieFn", {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/addMovieToFavourites.ts`,
         
        });

        const getReviewsByMovieIdYrReviewerFn = new node.NodejsFunction(this,  "GetReviewsByMovieIdYrReviewerFn",{
          ...appCommonFnProps,
            entry: `${__dirname}/../../lambdas/getReviewsByMovieIdYrReviewer.ts`,
            
          }
          );

          const getReviewByReviewerNameMovieIdFn = new node.NodejsFunction(this,  "GetReviewsByReviewerNameMovieIdFn",{
            ...appCommonFnProps,
              entry: `${__dirname}/../../lambdas/getReviewByReviewerNameMovieId.ts`,
              
            }
            );

            const updateReviewsFn = new node.NodejsFunction(this,  "UpdateReviewsFn",{
              ...appCommonFnProps,
                entry: `${__dirname}/../../lambdas/updateReview.ts`,
                
              }
              );

              

              getReviewByReviewerNameMovieIdFn.addToRolePolicy(new PolicyStatement({
                  actions: ['translate:TranslateText'],
                  resources: ["*"],
              }))

   //Permissions
   movieReviewsTable.grantReadData(getReviewsByMovieIdFn)
   movieReviewsTable.grantReadData(getReviewByReviewerNameFn)
   movieReviewsTable.grantReadWriteData(newMovieReviewFn)
   movieReviewsTable.grantReadData(getReviewsByMovieIdYrReviewerFn)
   movieReviewsTable.grantReadData(getReviewByReviewerNameMovieIdFn)
   movieReviewsTable.grantReadWriteData(updateReviewsFn)
   favouriteMoviesTable.grantReadWriteData(newFavouriteMovieFn)
 

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: `${__dirname}/../../lambdas/auth/authorizer.ts`,
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );




    const moviesEndpoint = api.root.addResource("movies");
    moviesEndpoint.addMethod(
      "GET"
    );


    const movieIdEndpoint = moviesEndpoint.addResource("{movieId}");
    movieIdEndpoint.addMethod(
      "GET"
    );
    const movieReviewsEndpoint = movieIdEndpoint.addResource("reviews");
    movieReviewsEndpoint.addMethod(
      "GET",new apig.LambdaIntegration(getReviewsByMovieIdFn, { proxy: true })
    );

    const movieReviewsAddEndpoint = moviesEndpoint.addResource("reviews");
    
    movieReviewsAddEndpoint.addMethod("POST", new apig.LambdaIntegration(newMovieReviewFn), { 
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
       });

       const favouriteMoviesAddEndpoint = moviesEndpoint.addResource("favourites");
       favouriteMoviesAddEndpoint.addMethod("POST", new apig.LambdaIntegration(newFavouriteMovieFn), { 
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
         });
  
    const reviewsByIdReviewerEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");
    reviewsByIdReviewerEndpoint.addMethod(
      "GET",new apig.LambdaIntegration(getReviewsByMovieIdYrReviewerFn, { proxy: true })
    );

    const reviewsEndpoint = api.root.addResource("reviews");
    reviewsEndpoint.addMethod(
      "GET"
    );
    const reviewerNameEndpoint = reviewsEndpoint.addResource("{reviewerName}");
    reviewerNameEndpoint.addMethod(
      "GET",new apig.LambdaIntegration(getReviewByReviewerNameFn, { proxy: true })
    );

   // const UpdateReview = movieReviewsEndpoint.addResource("{reviewerName}");
   reviewsByIdReviewerEndpoint.addMethod(
      "PUT",new apig.LambdaIntegration(updateReviewsFn), { 
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
         });

    const reviewerNameMovieIdEndpoint = reviewerNameEndpoint.addResource("{movieId}");
    const movieReviewsTransEndpoint = reviewerNameMovieIdEndpoint.addResource("translation");

    movieReviewsTransEndpoint.addMethod(
      "GET",new apig.LambdaIntegration(getReviewByReviewerNameMovieIdFn, { proxy: true })
    );

    

  }
}