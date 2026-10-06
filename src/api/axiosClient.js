import axiosInstance, {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  hasTokens,
} from './axiosInstance'

export {
  axiosInstance,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  hasTokens,
}

export const axiosClient = axiosInstance
export default axiosInstance
