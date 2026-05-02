---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/functions
fetched_at: 2026-05-02T00:00:00Z
title: DQL Functions
section: functions
---

# DQL Functions

DQL functions are organized by category below.

## Aggregation functions
These summarize values across sets of records.

- `avg` — Computes the arithmetic mean for a field across records.
- `collectArray` — Gathers values from the specified field into an array.
- `collectDistinct` — Collects only unique values from the specified field into an array.
- `correlation` — Determines the Pearson correlation for two numeric fields.
- `count` — Tallies the total records.
- `countDistinct` — Finds the cardinality of unique field values.
- `countDistinctApprox` — Estimates cardinality via a stochastic method.
- `countDistinctExact` — Determines exact cardinality up to one million distinct values.
- `countIf` — Tallies records satisfying a condition.
- `max` — Identifies the highest field value.
- `median` — Finds the middle value of an expression.
- `min` — Identifies the lowest field value.
- `percentile` — Computes a specified percentile.
- `percentiles` — Computes multiple specified percentiles.
- `percentileFromSamples` — Computes a percentile from an array expression.
- `percentRank` — Determines the percentile rank for a value.
- `stddev` — Computes standard deviation.
- `sum` — Adds up field values.
- `takeAny` — Returns an arbitrary non-null value.
- `takeFirst` — Returns the initial value.
- `takeLast` — Returns the final value.
- `takeMax` — Returns the maximum value.
- `takeMin` — Returns the minimum value.
- `variance` — Computes statistical variance.

## String functions
These transform and inspect text.

- `concat` — Joins expressions into one string.
- `contains` — Checks for a substring.
- `decodeUrl` — Produces a URL-decoded string.
- `encodeUrl` — Produces a URL-encoded string.
- `endsWith` — Verifies a suffix.
- `escape` — Produces an escaped string.
- `getCharacter` — Retrieves the character at a position.
- `indexOf` — Finds the first occurrence of a substring.
- `jsonField` — Extracts a JSON value by name.
- `jsonPath` — Extracts a JSON value via JSONPath.
- `lastIndexOf` — Finds the last occurrence of a substring.
- `levenshteinDistance` — Computes edit distance between strings.
- `like` — Pattern matching.
- `lower` — Converts text to lowercase.
- `matchesPattern` — Tests against a DPL pattern.
- `matchesPhrase` — Token-based phrase matching.
- `matchesValue` — Searches for a value in an attribute.
- `parse` — Extracts a value or record via pattern.
- `parseAll` — Extracts multiple values via pattern.
- `punctuation` — Extracts punctuation characters.
- `replacePattern` — Substitutes substrings matching a DPL pattern.
- `replaceString` — Substitutes substrings.
- `splitByPattern` — Splits by DPL pattern into an array.
- `splitString` — Splits according to parameters.
- `startsWith` — Verifies a prefix.
- `stringLength` — Returns character count.
- `substring` — Returns a code-unit range.
- `trim` — Strips surrounding whitespace.
- `unescape` — Reverses escaping.
- `unescapeHtml` — Processes HTML character entities.
- `upper` — Converts text to uppercase.

## Conversion and casting functions
These change values from one data type to another.

- `asArray` — Casts to array or returns null.
- `asBinary` — Casts to binary or returns null.
- `asBoolean` — Casts to boolean or returns null.
- `asDouble` — Casts to double or returns null.
- `asDuration` — Casts to duration or returns null.
- `asIp` — Casts to an IP address.
- `asLong` — Casts to long or returns null.
- `asNumber` — Casts to numeric type or returns null.
- `asRecord` — Casts to record or returns null.
- `asString` — Casts to string or returns null.
- `asTimeframe` — Casts to timeframe or returns null.
- `asTimestamp` — Casts to timestamp or returns null.
- `asUid` — Casts to uid or returns null.
- `decode` — Decodes encoded strings or binary data.
- `encode` — Encodes strings or binary data.
- `getHighBits` — Gets most significant bits from uid or IP.
- `getLowBits` — Gets least significant bits from uid or IP.
- `hexStringToNumber` — Hexadecimal to numeric conversion.
- `isUid128` — Checks uid128 subtype.
- `isUid64` — Checks uid64 subtype.
- `isUuid` — Checks uuid subtype.
- `numberToHexString` — Numeric to hexadecimal conversion.
- `toArray` — Converts to array.
- `toBoolean` — Converts to boolean.
- `toDouble` — Converts to double.
- `toDuration` — Converts to duration.
- `toIp` — Converts to IP address.
- `toLong` — Converts to long.
- `toString` — Produces string representation.
- `toTimeframe` — Converts to timeframe.
- `toTimestamp` — Converts to timestamp.
- `toUid` — Converts to uid.
- `type` — Returns value type as string.
- `uid128` — Builds uid128 from two longs.
- `uid64` — Builds uid64 from a long.
- `uuid` — Builds uuid from two longs.
- `smartscapeId` — Builds smartscapeId from string and long.
- `asSmartscapeId` — Casts to smartscapeId or returns null.
- `toSmartscapeId` — Converts to smartscapeId.

## Conditional functions
These return results based on conditions.

- `coalesce` — Returns the first non-null argument.
- `if` — Returns the then or else branch based on a condition.

## Boolean functions
These evaluate truthiness and nullability.

- `isFalseOrNull` — Checks for false or null.
- `isNotNull` — Checks that a value is present.
- `isNull` — Checks that a value is absent.
- `isTrueOrNull` — Checks for true or null.

## Time functions
These handle timestamps, durations, and timeframes.

- `duration` — Builds duration from amount and unit.
- `formatTimestamp` — Formats timestamp with pattern.
- `getDayOfMonth` — Extracts calendar day.
- `getDayOfWeek` — Extracts weekday.
- `getDayOfYear` — Extracts day number in year.
- `getEnd` — Gets end timestamp from timeframe.
- `getHour` — Extracts hour.
- `getMinute` — Extracts minute.
- `getMonth` — Extracts month.
- `getStart` — Gets start timestamp from timeframe.
- `getSecond` — Extracts second.
- `getYear` — Extracts year.
- `getWeekOfYear` — Extracts week number.
- `now` — Current query start time.
- `timeframe` — Builds timeframe from timestamps.
- `timestamp` — Builds timestamp from components.
- `timestampFromUnixMillis` — Converts Unix milliseconds.
- `timestampFromUnixNanos` — Converts Unix nanoseconds.
- `timestampFromUnixSeconds` — Converts Unix seconds.
- `unixMillisFromTimestamp` — Timestamp to Unix milliseconds.
- `unixNanosFromTimestamp` — Timestamp to Unix nanoseconds.
- `unixSecondsFromTimestamp` — Timestamp to Unix seconds.

## Array functions
These operate on ordered collections.

- `array` — Creates array from parameters.
- `arrayAvg` — Mean of array elements.
- `arrayConcat` — Joins arrays.
- `arrayCumulativeSum` — Running total.
- `arrayDelta` — Difference from prior non-null element.
- `arrayDiff` — Element-wise consecutive differences.
- `arrayDistinct` — Removes duplicates.
- `arrayElement` — Retrieves element by index.
- `arrayFirst` — First non-null element.
- `arrayFlatten` — Flattens nested arrays.
- `arrayIndexOf` — First matching element position.
- `arrayLast` — Last non-null element.
- `arrayLastIndexOf` — Last matching element position.
- `arrayMax` — Largest number.
- `arrayMedian` — Middle value.
- `arrayMin` — Smallest number.
- `arrayMovingAvg` — Windowed average.
- `arrayMovingMax` — Windowed maximum.
- `arrayMovingMin` — Windowed minimum.
- `arrayMovingSum` — Windowed sum.
- `arrayPercentile` — Percentile calculation.
- `arrayRemoveNulls` — Filters out nulls.
- `arrayReverse` — Reverses order.
- `arraySize` — Element count.
- `arraySlice` — Subarray extraction.
- `arraySort` — Ascending order sort.
- `arraySum` — Total of elements.
- `arraytoString` — String conversion.

## Vector distance functions
These calculate distances between numeric arrays.

- `vectorL1Distance` — Taxicab distance.
- `vectorL2Distance` — Euclidean distance.
- `vectorCosineDistance` — Cosine distance.
- `vectorInnerProductDistance` — Negative dot product.

## Network functions
These inspect and create IP addresses.

- `ip` — Creates IP address.
- `ipIn` — Checks inclusion in addresses or network.
- `ipIsLinkLocal` — Link-local check.
- `ipIsLoopback` — Loopback check.
- `ipIsPrivate` — Private address check.
- `ipIsPublic` — Public address check.
- `ipMask` — Masks address with bits.
- `isIp` — IPv4/v6 validation.
- `isIpV4` — IPv4 validation.
- `isIpV6` — IPv6 validation.

## Hash functions
These generate digests.

- `hashCrc32` — CRC32 digest.
- `hashMd5` — MD5 digest.
- `hashSha1` — SHA-1 digest.
- `hashSha256` — SHA-256 digest.
- `hashSha512` — SHA-512 digest.
- `hashXxHash32` — xxHash32 digest.
- `hashXxHash64` — xxHash64 digest.

## Bitwise functions
These perform operations on long expressions.

- `bitwiseAnd` — AND operation.
- `bitwiseCountOnes` — Counts set bits.
- `bitwiseNot` — Bit inversion.
- `bitwiseShiftLeft` — Left shift.
- `bitwiseShiftRight` — Right shift.
- `bitwiseOr` — OR operation.
- `bitwiseXor` — XOR operation.

## Mathematical functions
These execute numeric calculations.

- `abs` — Absolute value.
- `acos` — Arc cosine.
- `asin` — Arc sine.
- `atan` — Arc tangent.
- `atan2` — Polar coordinate angle.
- `bin` — Rounds down to bin size multiple.
- `ceil` — Ceiling to integer.
- `cos` — Cosine.
- `cosh` — Hyperbolic cosine.
- `cbrt` — Cubic root.
- `degreeToRadian` — Degree to radian conversion.
- `e` — Euler's number.
- `exp` — Exponential e^x.
- `floor` — Floor to integer.
- `hypotenuse` — sqrt(x² + y²).
- `log` — Natural logarithm.
- `log1p` — log(1+x).
- `log10` — Common logarithm.
- `pi` — π constant.
- `power` — Exponentiation.
- `radianToDegree` — Radian to degree conversion.
- `random` — Random double.
- `range` — Alignment to value range.
- `round` — Rounding to decimals.
- `signum` — Sign function.
- `sin` — Sine.
- `sinh` — Hyperbolic sine.
- `sqrt` — Square root.
- `tan` — Tangent.
- `tanh` — Hyperbolic tangent.

## Join functions
These combine records from subqueries.

- `lookup` — Matches source field to lookup table.
- `getNodeName` — Smartscape node name.
- `getNodeField` — Smartscape node field value.

## General functions
These serve broad purposes.

- `classicEntitySelector` — Entity selector matching.
- `entityAttr` — Entity attribute retrieval.
- `entityName` — Entity name retrieval.
- `exists` — Field existence check.
- `in` — Array membership test.
- `record` — Record construction.
