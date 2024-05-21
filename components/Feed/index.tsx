import { Box, BoxProps, Skeleton } from "@chakra-ui/react";
import ResizeObserver from "rc-resize-observer";
import { FC, useCallback, useRef } from "react";
import { CellMeasurer, CellMeasurerCache, List, WindowScroller } from "react-virtualized";
import { FETCH_USER_OUTBOX } from "services/api";
import useSWR from "swr";
import { OrderedCollection } from "types/ActivityPub";
import { FeedCard } from "./FeedCard";
import { NoteFeed as Note } from "./Note";

const feedComponents = { Note };
type FeedProps = {
  username: string;
} & BoxProps;

const cache = new CellMeasurerCache({
  defaultHeight: 150,
  fixedWidth: true,
});

export const Feed: FC<FeedProps> = ({ username, ...props }) => {
  const { data } = useSWR<OrderedCollection>(FETCH_USER_OUTBOX(username));
  const listRef = useRef<List>();
  const rowRenderer = useCallback(
    (props) =>
      FeedRenderer.bind(null, {
        ...props,
        item: data.orderedItems[props.index],
        username,
      })(),
    [data, username]
  );

  return (
    <Box>
      <Skeleton isLoaded={!!data} rounded="md" mb={3} minH={!!!data && "250px"}>
        {
          <Box {...props}>
            {data && data.orderedItems && (
              <WindowScroller>
                {({ width, height, isScrolling, onChildScroll, scrollTop }) => (
                  <List
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    deferredMeasurementCache={cache}
                    ref={listRef}
                    rowCount={data.orderedItems.length}
                    rowHeight={cache.rowHeight}
                    rowRenderer={rowRenderer}
                    autoWidth
                    width={width}
                    autoHeight
                    height={height}
                  />
                )}
              </WindowScroller>
            )}
          </Box>
        }
        {/* {isOtherServer && data.totalItems === 0 && <Card>empty</Card>} */}
      </Skeleton>
      <Skeleton isLoaded={!!data} mb={3} rounded="md" minH={!data && "calc(100vh / 10 * 2.5)"} />
      <Skeleton isLoaded={!!data} mb={3} rounded="md" minH={!data && "calc(100vh / 10 * 2)"} />
      <Skeleton isLoaded={!!data} mb={3} rounded="md" minH={!data && "calc(100vh / 10 * 3)"} />
    </Box>
  );
};

const FeedRenderer = ({ item, index, key, parent, style }) => {
  const Component = feedComponents[item.object.type];
  if (!Component) return null;
  return (
    <CellMeasurer key={key} cache={cache} parent={parent} columnIndex={0} rowIndex={index}>
      {({ measure }) => (
        <Box key={key} style={style}>
          <ResizeObserver onResize={measure}>
            <FeedCard item={item} mb={3}>
              <Component item={item} />
            </FeedCard>
          </ResizeObserver>
        </Box>
      )}
    </CellMeasurer>
  );
};
