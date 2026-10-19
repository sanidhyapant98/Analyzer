import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

// Directions the backend accepts. 1 = ascending, -1 = descending,
// "text" and "hashed" are special index types MongoDB supports.
const DIRECTIONS = [
  { value: "1", label: "1 (ascending)" },
  { value: "-1", label: "-1 (descending)" },
  { value: "text", label: "text" },
  { value: "hashed", label: "hashed" },
];

// Turn { age: 1 } into a readable string like "age: 1".
function formatKey(key) {
  return Object.entries(key)
    .map(([field, direction]) => `${field}: ${JSON.stringify(direction)}`)
    .join(", ");
}

export default function IndexManager() {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create-form state
  const [fieldName, setFieldName] = useState("");
  const [direction, setDirection] = useState("1");
  const [indexName, setIndexName] = useState("");

  // Fetch the index list. All setState calls happen after await,
  // so this is safe to call from both the effect and event handlers.
  async function fetchIndexes() {
    try {
      const response = await fetch("/api/indexes");
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.error || "Could not load indexes.");
        return;
      }

      setIndexes(payload.data);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  // Load the list once when the component first appears.
  useEffect(() => {
    fetchIndexes();
  }, []);

  // User-triggered refresh: show the spinner while re-fetching.
  async function refreshIndexes() {
    setError("");
    setLoading(true);
    await fetchIndexes();
  }

  async function handleCreate() {
    setError("");
    setSuccess("");

    // Client-side validation for instant feedback.
    const field = fieldName.trim();
    if (!field) {
      setError("Enter a field name to index.");
      return;
    }

    // Convert the direction back to a number when it is "1" or "-1",
    // because JSON numbers are what MongoDB expects.
    const directionValue = direction === "1" || direction === "-1" ? Number(direction) : direction;

    setCreating(true);
    try {
      const body = { key: { [field]: directionValue } };
      if (indexName.trim()) body.name = indexName.trim();

      const response = await fetch("/api/indexes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.error || "Could not create the index.");
        return;
      }

      setSuccess(`Index "${payload.data.name}" created. Re-run Analyze to compare the plan.`);
      setFieldName("");
      setIndexName("");
      await fetchIndexes();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setCreating(false);
    }
  }

  async function handleDrop(name) {
    setError("");
    setSuccess("");

    // Native confirm keeps this basic — no custom dialog needed for V1.
    const confirmed = window.confirm(
      `Drop index "${name}"? The next matching query will scan the collection again.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/indexes/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.error || "Could not drop the index.");
        return;
      }

      setSuccess(`Index "${name}" dropped.`);
      await fetchIndexes();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Index Manager
        </Typography>
        <IconButton onClick={refreshIndexes} disabled={loading} aria-label="refresh indexes" size="small">
          {loading ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
        </IconButton>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create or drop single-field indexes on the <code>users</code> collection, then re-run
        Analyze to see whether MongoDB switches between COLLSCAN and IXSCAN. This tool reports
        what MongoDB does — it never picks indexes for you.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Current indexes */}
      {loading ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading indexes…</Typography>
        </Stack>
      ) : (
        <List dense sx={{ mb: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          {indexes.map((index) => (
            <ListItem
              key={index.name}
              secondaryAction={
                // _id_ is mandatory in MongoDB — never show a delete button for it.
                index.name !== "_id_" ? (
                  <IconButton
                    edge="end"
                    aria-label={`drop index ${index.name}`}
                    onClick={() => handleDrop(index.name)}
                    size="small"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <ListItemText
                primary={index.name}
                secondary={formatKey(index.key)}
                primaryTypographyProps={{ fontFamily: "monospace", fontWeight: "bold" }}
                secondaryTypographyProps={{ fontFamily: "monospace" }}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Create form */}
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Create Index
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <TextField
          label="Field"
          value={fieldName}
          onChange={(event) => setFieldName(event.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
          placeholder="age"
        />
        <TextField
          label="Direction"
          select
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
          size="small"
          sx={{ minWidth: 170 }}
        >
          {DIRECTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Name (optional)"
          value={indexName}
          onChange={(event) => setIndexName(event.target.value)}
          size="small"
          sx={{ minWidth: 170 }}
          placeholder="e.g. age_1"
        />
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating}
          startIcon={
            creating ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />
          }
        >
          {creating ? "Creating…" : "Create"}
        </Button>
      </Stack>
    </Paper>
  );
}
