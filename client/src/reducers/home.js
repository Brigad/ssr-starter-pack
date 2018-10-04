const initialState = {
  posts: [],
  isLoading: false,
  isError: false
}

const homeReducer = function (state = initialState, action) {
  switch (action.type) {
    case "ALL_POSTS_PENDING":
      return { ...state, isLoading: true, isError: false }
    case "ALL_POSTS_FULFILLED":
      return { ...state, posts: action.payload.data, isLoading: false, isError: false }
    case "ALL_POSTS_REJECTED":
      return { ...state, isLoading: false, isError: true }
    default:
      return state
  }
}

export default homeReducer;
