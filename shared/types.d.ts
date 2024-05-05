
export type SignUpBody = {
    username: string;
    password: string;
    email: string
  }

  export type ConfirmSignUpBody = {
    username: string;
    code: string;
  }

  export type SignInBody = {
    username: string;
    password: string;
  }

  export type MovieReview =   {
    movieId: number,
    reviewDate: string,
    reviewerName: string,
    content: string,
    rating: 1 | 2 | 3| 4| 5
    
  
    
  }

  export type FavouriteMovie =   {
    movieId: number
    
  
    
  }
  
  type Review = {
    reviewDate: string,
    reviewBody: ReviewBody
  }
  
    type ReviewBody = {  
    reviewerName: string,
    content: string,
    rating: 1 | 2 | 3| 4| 5
  }
  
  export type ReviewsByMovieIdQueryParams = {
    movieId: string
  }
  
  export type ReviewsByMinRatingQueryParams = {
    rating: string
  }
  
  
  export type ReviewsTranslation = {
    language: string
  }