import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider";

export function useFirestoreData<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  transform?: (data: any) => T
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, collectionName), ...constraints);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const transformedData = transform ? docs.map(transform) : docs;
          setData(transformedData as T[]);
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching ${collectionName}:`, error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error(`Error setting up ${collectionName} listener:`, error);
      setError('Failed to set up data listener');
      setLoading(false);
    }
  }, [user, collectionName, constraints, transform]);

  return { data, loading, error };
}

// 预定义的Hook
export function useClients() {
  const { user } = useAuth();
  return useFirestoreData(
    "clients",
    user ? [where("coachId", "==", user.uid)] : []
  );
}

export function usePackages() {
  const { user } = useAuth();
  return useFirestoreData(
    "packages",
    user ? [where("coachId", "==", user.uid)] : []
  );
}

export function useSchedules() {
  const { user } = useAuth();
  return useFirestoreData(
    "schedules",
    user ? [where("coachId", "==", user.uid)] : []
  );
}

export function useProspects() {
  const { user } = useAuth();
  return useFirestoreData(
    "prospects",
    user ? [where("coachId", "==", user.uid)] : []
  );
} 