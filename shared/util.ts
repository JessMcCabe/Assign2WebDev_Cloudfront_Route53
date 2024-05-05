import { marshall } from "@aws-sdk/util-dynamodb";
import { MovieReview} from "./types";
import { FavouriteMovie } from "./types";

type Entity = MovieReview;  // NEW

type EntityF = FavouriteMovie; 

export const generateItem = (entity: Entity| EntityF) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[] |  EntityF[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};


