import axios from 'axios';

import { URL_API } from '../config/constants';

let POSTS_API = `${URL_API}/posts`;

const allPosts = () => {
  return axios.get(POSTS_API)
}

const PostApi = { allPosts }

export { PostApi }
