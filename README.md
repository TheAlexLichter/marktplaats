# marktplaats

A command-line interface for searching [Marktplaats.nl](https://www.marktplaats.nl) listings.

## Install

```bash
# npm
npm install -g marktplaats

# pnpm
pnpm add -g marktplaats

# yarn
yarn global add marktplaats

# bun
bun add -g marktplaats
```

### From source

```bash
git clone https://github.com/TheAlexLichter/marktplaats.git
cd marktplaats
pnpm install
pnpm build
npm link
```

## Usage

### Search listings

```bash
marktplaats search "fiets"
```

With filters:

```bash
# Sort by price, ascending
marktplaats search "fiets" --sort PRICE --sort-order INCREASING

# Location-based search
marktplaats search "fiets" --postcode 1012AB --distance 10000

# Price range
marktplaats search "fiets" --min-price 50 --max-price 200

# Filter by category, limit results
marktplaats search "fiets" --category 445 --limit 10

# Paginate
marktplaats search "fiets" --page 2

# Interactive TUI mode
marktplaats search "fiets" -i

# Output as JSON
marktplaats search "fiets" --json
```

#### Search options

| Option          | Alias | Description                                                     | Default      |
| --------------- | ----- | --------------------------------------------------------------- | ------------ |
| `--limit`       | `-l`  | Results per page                                                | `25`         |
| `--sort`        | `-s`  | Sort by: `DATE`, `PRICE`, `OPTIMIZED`, `LOCATION`, `SORT_INDEX` | `SORT_INDEX` |
| `--sort-order`  |       | `DECREASING` or `INCREASING`                                    | `DECREASING` |
| `--postcode`    | `-p`  | Postcode for location search                                    |              |
| `--distance`    | `-d`  | Radius in meters from postcode                                  |              |
| `--category`    |       | Category ID                                                     |              |
| `--min-price`   |       | Minimum price in euros                                          |              |
| `--max-price`   |       | Maximum price in euros                                          |              |
| `--page`        |       | Page number                                                     | `1`          |
| `--interactive` | `-i`  | Interactive TUI mode                                            | `false`      |
| `--json`        |       | Output as JSON                                                  | `false`      |

### View a listing

```bash
marktplaats view <itemId>
marktplaats view <itemId> --json
```

### Open in browser

```bash
marktplaats open <itemId>
```

### Browse categories

```bash
# List all categories
marktplaats categories

# Filter by name
marktplaats categories fiets
```

### View seller's listings

```bash
# Pass any listing ID to see other listings from the same seller
marktplaats seller <itemId>
marktplaats seller <itemId> --json
```

### Saved searches

```bash
# Save a search
marktplaats saved add bikes fiets --postcode 1012AB --distance 5000

# List saved searches
marktplaats saved list

# Run a saved search
marktplaats saved run bikes

# Remove a saved search
marktplaats saved remove bikes
```

### Watch for new listings

```bash
# Watch a search (checks every 60s by default)
marktplaats watch "fiets"

# Custom interval
marktplaats watch "macbook" --interval 30

# With filters
marktplaats watch "fiets" --min-price 50 --max-price 200 --postcode 1012AB
```

### Config

```bash
# Set defaults
marktplaats config set postcode 1012AB
marktplaats config set distance 5000

# View config
marktplaats config get

# Get a single key
marktplaats config get postcode

# Remove a default
marktplaats config unset postcode

# Show config file path
marktplaats config path
```

Config defaults are merged with CLI flags (flags take precedence).

### JSON output

All commands that support `--json` produce structured output with:

- Full listing URLs
- Price in both cents and euros
- Geo coordinates (latitude/longitude)
- Seller info with verification status
- Multi-resolution image URLs (small, medium, large, extraLarge)
- Extended attributes as key-value pairs
- Ad/reserved flags, traits, and verticals

## Development

```bash
# Install dependencies
vp install

# Dev mode (watch)
vp pack --watch

# Run tests
vp test

# Lint & format
vp lint
vp fmt

# Build
vp pack
```

## License

MIT
