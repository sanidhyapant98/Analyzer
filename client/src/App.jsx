import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import IndexManager from "./components/IndexManager";

// The 5 statistics we display, with human-friendly labels.
// We map over this instead of repeating card markup 5 times.
const STAT_FIELDS = [
  { key: "executionTimeMs", label: "Execution Time", suffix: " ms" },
  { key: "documentsExamined", label: "Documents Examined", suffix: "" },
  { key: "documentsReturned", label: "Documents Returned", suffix: "" },
  { key: "keysExamined", label: "Index Keys Examined", suffix: "" },
];

const DEFAULT_FILTER = '{\n  "age": {\n    "$gt": 40\n  }\n}';

export default function App() {
  const [filterText, setFilterText] = useState(DEFAULT_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleAnalyze() {
    setError("");
    setResult(null);

    // Step 1: validate JSON in the browser BEFORE hitting the server.
    // This gives instant feedback and saves a pointless network request.
    let filter;
    try {
      filter = JSON.parse(filterText);
    } catch (parseError) {
      setError("Invalid JSON: " + parseError.message);
      return;
    }

    if (filter === null || typeof filter !== "object" || Array.isArray(filter)) {
      setError('The filter must be a JSON object, e.g. { "age": { "$gt": 25 } }.');
      return;
    }

    // Step 2: send it to the backend
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.error || "Something went wrong.");
        return;
      }

      setResult(payload.data);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  // Color the stage chip by type — informational only, not a judgment.
  function stageColor(stage) {
    if (stage === "IXSCAN") return "success";
    if (stage === "COLLSCAN") return "warning";
    return "default";
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Mini MongoDB Query Analyzer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter a JSON filter to see how MongoDB actually executes it. The statistics
          below come from the real <code>explain("executionStats")</code> output.
        </Typography>
      </Box>

      {/* Filter input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Query Filter
        </Typography>
        <TextField
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          multiline
          rows={6}
          fullWidth
          placeholder='e.g. { "city": "Delhi" }'
          sx={{
            mb: 2,
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
              fontSize: "0.95rem",
            },
          }}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleAnalyze}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowRoundedIcon />
          }
        >
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </Paper>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Box>
          {/* Submitted filter echo */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#e8f5e9" }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Submitted Filter
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{ fontFamily: "monospace", margin: 0, whiteSpace: "pre-wrap" }}
            >
              {JSON.stringify(result.filter, null, 2)}
            </Typography>
          </Paper>

          {/* Execution stages */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Execution Plan Stages
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {result.executionStages.length > 0 ? (
                result.executionStages.map((stage) => (
                  <Chip
                    key={stage}
                    label={stage}
                    color={stageColor(stage)}
                    variant="outlined"
                    sx={{ fontFamily: "monospace" }}
                  />
                ))
              ) : (
                <Chip label="No recognizable scan stage found" color="default" />
              )}
            </Stack>
          </Box>

          {/* Stat cards */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Execution Statistics
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            {STAT_FIELDS.map((field) => (
              <Card key={field.key} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {field.label}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {result[field.key]}
                    {field.suffix}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            {/* Stages count card fits the grid too */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Scan Type
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {result.executionStages.join(", ") || "Unknown"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Index manager — create/drop indexes, then re-analyze */}
      <Box sx={{ mt: 4 }}>
        <IndexManager />
      </Box>
    </Container>
  );
}
