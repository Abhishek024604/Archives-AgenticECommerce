import { useState, useEffect } from "react";
import { fetchSubCategories } from "../api/productApi";

let cachedSubCategories = null;

export const useSubCategories = () => {
    const [subCategories, setSubCategories] = useState(cachedSubCategories || []);
    const [loading, setLoading] = useState(!cachedSubCategories);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cachedSubCategories) {
            return;
        }

        let active = true;

        const loadSubCategories = async () => {
            try {
                setLoading(true);
                const res = await fetchSubCategories();
                if (active) {
                    cachedSubCategories = res.data;
                    setSubCategories(res.data);
                }
            } catch (err) {
                if (active) {
                    setError(err);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadSubCategories();

        return () => {
            active = false;
        };
    }, []);

    return { subCategories, loading, error };
};
