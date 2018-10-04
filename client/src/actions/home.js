import { PostApi } from '../api/posts';

export function allPosts() {
  return {
    type: "ALL_POSTS",
    payload: PostApi.allPosts()
  }
}
