import { API } from "./axios";

export const getSellerReviews = async () => {
    try {
        const response = await API.get("/reviews/seller");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateReviewStatus = async (reviewId, status) => {
    try {
        const response = await API.put(`/reviews/${reviewId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
