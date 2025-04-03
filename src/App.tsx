import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

interface LoadingState {
  collaborative: boolean;
  content: boolean;
  azure: boolean;
}

interface Recommendation {
  data: any; // or a more specific type for 'data'
  error: string; // or a more specific type for 'error'
}

interface Recommendations {
  collaborative: Recommendation;
  content: Recommendation;
  azure: Recommendation;
}

const App = () => {
  const [userId, setUserId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [loadings, setLoadings] = useState<LoadingState>({collaborative: false, content: false, azure: false});
  const [recommendations, setRecommendations] = useState<Recommendations>({
    collaborative: { data: [], error: "" },
    content: { data: [], error: "" },
    azure: { data: [], error: "" },
  });

  const fetchRecommendations = async (type: "collaborative" | "content" | "azure", endpoint: string) => {
    setLoadings({...loadings, [type]: true });

    try {
      const endpointData = endpoint.split(" ");
      let id: string | undefined;
      if (endpointData.length > 1) {
        [endpoint, id] = endpointData;
      }
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch");
      if (id) {
        const data = await response.text();
        const [header, ...plainRows] = data.trim().split("\n").map(line => line.split(","));
        const rows = plainRows.map(row => Object.fromEntries(header.map((key, i) => [key, row[i]])));
        const row = rows.find(row => row.articleId === id);
        if (row) {
          setRecommendations(prev => ({ ...prev, [type]: { data: Object.values(row).slice(1), error: "" } }));
        } else {
          setRecommendations(prev => ({ ...prev, [type]: { data: [], error: "No recommendations found" } }));
        }
      } else {
        const data = await response.json();
        setRecommendations(prev => ({ ...prev, [type]: { data, error: "" } }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setRecommendations(prev => ({ ...prev, [type]: { data: [], error: "Error fetching data" } }));
    }
    setLoadings({...loadings, [type]: false });
  };


  const handleFetch = () => {
    if (!userId || !articleId) {
      alert("Please enter both user ID and article ID");
      return;
    }
    fetchRecommendations("collaborative", `/public/data/collaborative.csv ${articleId}`);
    // fetchRecommendations("content", `public/data/content.csv ${articleId}`);
    // fetchRecommendations("azure", `https://fake-api.com/azure?userId=${userId}&articleId=${articleId}`);
  };


  return (
    <div className="container">
      <h1 className="text-center mb-4">News Article Recommendations</h1>
  
      <div className="mb-4">
        <div className="row justify-content-center">
          <div className="col-md-5 col-sm-6 mb-3">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="col-md-5 col-sm-6 mb-3">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="Enter article ID"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-primary w-100"
          disabled={!Object.values(loadings).every(value => !value)}
          onClick={handleFetch}
        >
          {!Object.values(loadings).every(value => !value) ? "Loading..." : "Get Recommendations"}
        </button>
      </div>
  
      <div className="row">
        {Object.entries(recommendations).map(([key, { data, error }]) => (
          <div className="col-md-4 mb-4" key={key}>
            <div className="card shadow-sm border-light">
              <div className="card-header d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-link text-start w-100 text-decoration-none"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${key}`}
                >
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)} Model</strong>
                </button>
              </div>
              <div id={key} className="collapse show">
                <div className="card-body">
                  {loadings[key as "collaborative" | "content" | "azure"] ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-danger">{error}</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {data.length > 0 ? (
                        data.map((item: any, index: number) => (
                          <li key={index} className="list-group-item">{item}</li>
                        ))
                      ) : (
                        <div>No recommendations found</div>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;