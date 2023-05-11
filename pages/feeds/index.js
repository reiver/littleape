import {
  Box,
  Button,
  FormControl,
  Image,
  Input,
  Link,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { extract } from "@extractus/feed-extractor";
import { useEffect, useState } from "react";
import { Navbar } from "components/Navbar";

// import { Link } from "react-router-dom";

// check tag format and save it like an array
// fewer feedData loop -> newFeedData
// wrong search
// edit tags

// move delete fetched feed btn upper
// fix hover style of bookmarked btn

const PAGE_SIZE = 10; // number of items to show per page
const PAGE_RANGE = 5; // number of page buttons to show in the range

function AllFeeds() {
  const [feedUrl, setFeedUrl] = useState("");
  const [feedData, setFeedData] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeeds, setSelectedFeeds] = useState([]);
  const [tag, setTag] = useState("");
  const [showData, setShowData] = useState("fetched");


  useEffect(() => {
    // fetching selected feeds from local storage -> in order to show navigation buttons (download and view btns)
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    if (storedArray) {
      setSelectedFeeds(storedArray);
    }
    // fetching previously fetched items
    let storedArray2 = JSON.parse(localStorage.getItem("fetchedFeeds"));
    if (storedArray2) {
      setFeedData(storedArray2);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(feedUrl == ""){
      setError('please insert a url!')
    }else{
      setError("")
      // fetch and parse the feed here
      let result = await extract("http://127.0.0.1:8080/" + feedUrl, {
        normalization: false,
      });
      console.log(result);
      let concatFeeds = null;
      if (result.entry) {
        console.log("atom");
        result = addAuthorInfo(result, "atom");
        // handling feeds without published date (only updated date)
        if (!result.entry[0].published) {
          changeFieldNameOfArray("updated", "published", result.entry);
        }
        concatFeeds = feedData.concat(result.entry);
      } else if (result.item) {
        console.log("rss");
        result = addAuthorInfo(result, "rss");
        changeFieldNameOfArray("pubDate", "published", result.item);
        concatFeeds = feedData.concat(result.item);
      } else if (result.items) {
        console.log("json");
        result = addAuthorInfo(result, "json");
        // normalizing json fields
        changeFieldNameOfArray("date_published", "published", result.items);
        changeFieldNameOfArray("content_html", "content", result.items);
        changeFieldNameOfArray("url", "link", result.items);
        concatFeeds = feedData.concat(result.items);
      }
      concatFeeds = sortAccordingToDate(concatFeeds);
  
      // Filter out duplicates
      let uniqueResults = Array.from(new Set(concatFeeds.map((result) => result.id))).map((id) => {
        return concatFeeds.find((result) => result.id === id);
      });
      // adding bookmarked status for newly fetched items
      uniqueResults = addBookMarkedStatus(uniqueResults);
      setFeedData(uniqueResults);
      // updating local storage and saving newly fetched feeds
      localStorage.setItem("fetchedFeeds", JSON.stringify(uniqueResults));
      setFeedUrl("");
    }
  };

  // calculate the total number of pages
  const totalPages = Math.ceil(feedData.length / PAGE_SIZE);

  // calculate the range of page numbers to display
  let pageRangeStart = Math.max(1, currentPage - PAGE_RANGE);
  let pageRangeEnd = Math.min(totalPages, currentPage + PAGE_RANGE);
  if (pageRangeEnd - pageRangeStart < PAGE_RANGE * 2) {
    // adjust the range if it's too small
    if (pageRangeStart === 1) {
      pageRangeEnd = Math.min(totalPages, pageRangeStart + PAGE_RANGE * 2);
    } else {
      pageRangeStart = Math.max(1, pageRangeEnd - PAGE_RANGE * 2);
    }
  }

  // create an array of page numbers to display
  const pageNumbers = [];
  if (pageRangeStart > 1) {
    pageNumbers.push(1);
    if (pageRangeStart > 2) {
      pageNumbers.push("...");
    }
  }
  for (let i = pageRangeStart; i <= pageRangeEnd; i++) {
    pageNumbers.push(i);
  }
  if (pageRangeEnd < totalPages) {
    if (pageRangeEnd < totalPages - 1) {
      pageNumbers.push("...");
    }
    pageNumbers.push(totalPages);
  }

  // calculate the start and end index of the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const addBookMarkedStatus = (array) => {
    for (let index = 0; index < array.length; index++) {
      if (!array[index].bookmarked) {
        array[index].bookmarked = false;
        array[index].tags = "";
      }
    }
    return array;
  };

  // setting identical field names for all types of feeds
  const changeFieldNameOfArray = (old_key, new_key, array) => {
    for (let index = 0; index < array.length; index++) {
      changeFieldNameofObject(array[index], old_key, new_key);
    }
  };

  const changeFieldNameofObject = (obj, old_key, new_key) => {
    if (old_key !== new_key) {
      Object.defineProperty(obj, new_key, Object.getOwnPropertyDescriptor(obj, old_key));
      delete obj[old_key];
    }
  };

  const sortAccordingToDate = (arr) => {
    arr.sort((a, b) => {
      const dateA = new Date(Date.parse(a.published));
      const dateB = new Date(Date.parse(b.published));
      return dateB - dateA;
    });
    return arr;
  };

  const addFeed = (feed) => {
    // adding the feed to selected feed array
    // adding selected tags to the item
    feed.tags = tag.split(",");
    // changing bookmarked status of the item in order to disable the button after refresh
    feed.bookmarked = true;
    setSelectedFeeds([...selectedFeeds, feed]);
    // storing the selected feed in local storage
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    if (storedArray == null) {
      storedArray = [];
    }
    storedArray.push(feed);
    setSelectedFeeds(storedArray);
    localStorage.setItem("savedFeeds", JSON.stringify(storedArray));

    // let newFeedData = feedData;
    // for (let index = 0; index < newFeedData.length; index++) {
    //     if(newFeedData[index].id == feed.id){
    //         newFeedData[index].bookmarked = true;
    //         newFeedData[index].tags = tag;
    //     }
    // }
    localStorage.setItem("fetchedFeeds", JSON.stringify(feedData));
    setTag("");
  };

  const addAuthorInfo = (feeds, type) => {
    if (type == "atom") {
      for (let index = 0; index < feeds.entry.length; index++) {
        feeds.entry[index].author = feeds.author ? feeds.author.name : "";
        feeds.entry[index].authorLink = feeds.link;
        if (feeds.logo) {
          feeds.entry[index].logo = feeds.logo.includes("://")
            ? feeds.logo
            : feeds.link + feeds.logo;
        } else if (feeds.icon) {
          feeds.entry[index].logo = feeds.icon.includes("://")
            ? feeds.icon
            : feeds.link + feeds.icon;
        } else {
          feeds.logo = "";
        }
      }
    } else if (type == "rss") {
      for (let index = 0; index < feeds.item.length; index++) {
        feeds.item[index].author = feeds["itunes:owner"]
          ? feeds["itunes:owner"]["itunes:name"]
          : "";
        feeds.item[index].authorLink = feeds["itunes:owner"]
          ? feeds["itunes:owner"]["itunes:email"]
          : "";
        if (feeds["itunes:image"]) {
          feeds.item[index].logo = feeds["itunes:image"]["url"]
            ? feeds["itunes:image"]["url"]
            : feeds["itunes:image"]["@_href"]
            ? feeds["itunes:image"]["@_href"]
            : "";
        } else if (feeds["media:thumbnail"]) {
          feeds.item[index].logo = feeds["media:thumbnail"]["url"]
            ? feeds["media:thumbnail"]["url"]
            : feeds["media:thumbnail"]["@_href"]
            ? feeds["media:thumbnail"]["@_href"]
            : "";
        } else if (feeds["media:content"]) {
          feeds.item[index].logo = feeds["media:content"]["url"]
            ? feeds["media:content"]["url"]
            : feeds["media:content"]["@_href"]
            ? feeds["media:content"]["@_href"]
            : "";
        }
      }
    } else if (type == "json") {
      for (let index = 0; index < feeds.items.length; index++) {
        feeds.items[index].author = feeds.author.name;
        feeds.items[index].authorLink = feeds.home_page_url;
        if (feeds.items[index].image) {
          feeds.items[index].logo = feeds.items[index].image;
        } else if (feeds.items[index].icon) {
          feeds.items[index].logo = feeds.items[index].icon;
        } else {
          feeds.items[index].logo = "";
        }
      }
    }
    return feeds;
  };

  const contentHandler = (item) => {
    if (item.content) {
      if (item.content.includes("\n")) {
        item.content = item.content.replaceAll("\n", "<br>");
      }
      return <div dangerouslySetInnerHTML={{ __html: item.content }} />;
    } else if (item.description) {
      if (item.description.includes("\n")) {
        item.description = item.description.replaceAll("\n", "<br>");
      }
      return <div dangerouslySetInnerHTML={{ __html: item.description }} />;
    }
  };

  const download = () => {
    // Convert the array of objects to a JSON string
    let jsonString = JSON.stringify(selectedFeeds);

    // Create a downloadable file using the Blob object
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "savedFeeds.json";
    document.body.appendChild(link);
    link.click();
  };

  const deleteFeeds = () => {
    if (showData == "fetched") {
      console.log("deleteFetchedFeeds");
      localStorage.setItem("fetchedFeeds", JSON.stringify([]));
      setFeedData([]);
    } else if (showData == "saved") {
      let newFeedData = feedData;
      for (let index = 0; index < newFeedData.length; index++) {
        newFeedData[index].bookmarked = false;
        newFeedData[index].tags = "";
      }
      localStorage.setItem("savedFeeds", JSON.stringify([]));
      localStorage.setItem("fetchedFeeds", JSON.stringify(newFeedData));
      setFeedData(newFeedData);
      setSelectedFeeds([]);
    }
  };

  const handleTagsChange = (event) => {
    setTag(event.target.value);
  };

  const viewAllFeeds = (event) => {
    if (showData == "saved") {
      setError("")
      setShowData("fetched");
    }
  };

  const viewSavedFeeds = () => {
    if (showData == "fetched") {
      setError("")
      setShowData("saved");
    }
  };

  // const onChange = (e) => {
  //   console.log('in test')
  //   console.log(e)
  // }

  const showDataFunction = () => {
    let data = [];
    if (showData == "fetched") {
      data = feedData;
    } else if (showData == "saved") {
      data = selectedFeeds;
    }
    return data.length ? (
      data.slice(startIndex, endIndex).map((item, index) => (
        <ListItem
          key={index}
          position="relative"
          display="flex"
          flexDirection="column"
          marginBottom="1rem"
          padding="1rem"
          backgroundColor="white"
          borderRadius="0.5rem"
          border="1px solid #EBEBEB"
        >
          <Box
            display="flex"
            flexDirection="revert"
            width="100%"
            // className="author_container"
          >
            <Image
              width="50px"
              height="50px"
              borderRadius="50px"
              //   className='author_img'
              src={item.logo}
            />
            <Box
              width="inherit"
              height="max-content"
              margin="auto"
              marginLeft="10px"
              //   className='author_info_wrapper'
            >
              <Text
                fontSize="1.20rem"
                fontWeight="700"
                margin="0"
                // className='author_info_title'
              >
                {item.title}
              </Text>
              <Text
                fontSize="0.85rem"
                margin="0"
                margin-top="5px"
                color="#2e2e2e"
                // className='author_info_name'
              >
                {item.author} -
                <Link href={item.authorLink} color="#2e2e2e" textDecoration="none">
                  {item.authorLink}
                </Link>
              </Text>
            </Box>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            padding="10px 0"
            // className='content_container'
          >
            <Box
              fontSize="0.8rem"
              fontStyle="italic"
              color="#666"
              //   className="date"
            >
              {item.published ? item.published : "unavailable"}
            </Box>
            <Link
              fontSize="0.8rem"
              fontStyle="italic"
              color="#666"
              //   className="date"
              href={item.link}
            >
              {item.link}
            </Link>
            <Box
              marginTop="8px"
              //   className="content"
            >
              {contentHandler(item)}
            </Box>
          </Box>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            marginBottom="16px"
            // className='bookmark-button'
          >
            <Input
              id={index + "_input"}
              type="text"
              value={item.tags ? item.tags : tag}
              onChange={handleTagsChange}
              placeholder="Add tags for example Apple, Banana, ..."
              disabled={item.tags}
              //    className="input"
              padding="8px"
              fontSize="16px"
              border="1px solid #ccc"
              borderRadius="4px"
              marginRight="8px"
              flexGrow="1"
              marginLeft="5px"
              display="none"
            />
            <Box
              style={{ display: item.tags ? "flex" : "none" }}
              display="flex"
              flexDirection="row"
              width="max-content"
              margin="auto"
              marginLeft="0"
              //  className='tag_container'
            >
              {Array.isArray(item.tags)
                ? item.tags.map((tag, index) => {
                    return (
                      <Box
                        border="1px solid gray"
                        margin="0 5px"
                        display="flex"
                        flexDirection="revert"
                        height="maxContent"
                        backgroundColor="#EBEBEB"
                        borderRadius="20px"
                        padding="5px 10px"
                        // className="tag"
                        key={index}
                      >
                        <Image src="/Tag.svg" height="max-content" />
                        <Text
                          height="max-content"
                          marginLeft="5px"
                          fontWeight="600"
                          color="#666666"
                        >
                          {tag}
                        </Text>
                      </Box>
                    );
                  })
                : null}
            </Box>
            <Button
              border="1px solid black"
              borderColor="black"
              backgroundColor="black"
              width="max-content"
              fontSize="12px"
              fontWeight="bold"
              borderRadius="4px"
              padding="0 16px"
              color="white"
              _disabled={{
                backgroundColor: "#EBEBEB",
                borderColor: "gray",
                color: "#666666",
                cursor: "default"
              }}
              _hover={{ bg: '#EBEBEB', color: "#666666" }}
              // transition="background-color 0.2s ease-in-out"
              // className="button add_btn"
              id={index + "_btn"}
              disabled={item.bookmarked}
              onClick={() => {
                let buttonText = document.getElementById(index + "_btn").innerText;
                if (buttonText == "Save") {
                  addFeed(item);
                  document.getElementById(index + "_input").style.display = "none";
                  document.getElementById(index + "_btn").innerText = "Bookmarked";
                } else {
                  document.getElementById(index + "_btn").innerText = "Save";
                  document.getElementById(index + "_input").style.display = "unset";
                }
              }}
            >
              {item.bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </Box>
        </ListItem>
      ))
    ) : showData == "saved" ? (
      <Box display="flex" padding="30px 40px" border="1px solid #EBEBEB" borderRadius="12px">
        there is no item to be shown :(
      </Box>
    ) : null;
  };

  return (
    <Box
      bg="white"
      _dark={{ bg: "dark.900" }}
      display="flex"
      flexDirection="column"
      minH="100vh"
      width="100%"
    >
      <Navbar />
      <Box
        //   className="App"
        display="flex"
        flexDirection="column"
        alignItems="center"
        margin="auto"
        height="max-content"
        padding="3rem"
        backgroundColor="white"
        width="100%"
      >
        {/* subscribe form */}
        {showData == "fetched" ? (
          <FormControl
            display="flex"
            flexDirection="column"
            width="70%"
            // className="form"
          >
            <Input
              borderRadius="7px"
              border="#aca8a8 1px solid"
              padding="1rem"
              fontSize="medium"
              margin="20px auto"
              //   className='input'
              type="text"
              placeholder="Enter feed URL"
              value={feedUrl}
              onChange={(event) => {
                            setFeedUrl(event.target.value)
                            setError("")
                          }
                        }
            />
            <Button
              border="1px solid black"
              borderColor="black"
              backgroundColor="#FFCC00"
              width="max-content"
              margin="5px auto"
              fontSize="12px"
              fontWeight="bold"
              borderRadius="4px"
              padding="0 16px"
              onClick={handleSubmit}
            >
              Subscribe
            </Button>
          </FormControl>
        ) : null}
        {error && (
          <Box
            color="red"
            marginTop="1rem"
            // className="error"
          >
            {error.message ? error.message : error}
          </Box>
        )}
        <Box
          display="flex"
          flexDirection="column"
          maxWidth="900px"
          // className='info-container'
        >
          <UnorderedList
            listStyle="none"
            marginTop="2rem"
            padding="0"
            width="100%"
            margin="20px auto"
          >
            {/* show data */}
            {showDataFunction()}
            {(showData == "fetched" && feedData.length) ||
            (showData == "saved" && selectedFeeds.length) ? (
              // delete btn
              <Box
                display="flex"
                flex-direction="row"
                // className='btn_container'
              >
                <Button
                  border="1px solid black"
                  borderColor="black"
                  backgroundColor="black"
                  width="max-content"
                  margin="25px auto"
                  fontSize="12px"
                  fontWeight="bold"
                  borderRadius="4px"
                  padding="0 16px"
                  color="white"
                  //   className='button delete_btn'
                  onClick={deleteFeeds}
                >
                  {showData == "fetched"
                    ? "Delete Fetched Feeds"
                    : showData == "saved"
                    ? "Delete Bookmarked Feeds"
                    : ""}
                </Button>
              </Box>
            ) : null}
            {/* pagination */}
          </UnorderedList>
          {(showData == "fetched" && feedData.length) ||
          (showData == "saved" && selectedFeeds.length) ? (
            <Box
              width="max-content"
              margin="auto"
              //   className='pagination_wrapper'
            >
              <Button
                color="white"
                border="none"
                cursor="pointer"
                fontSize="large"
                width="max-content"
                padding="10px 15px"
                margin="5px"
                borderRadius="30px"
                backgroundColor="#0077cc"
                // className='button'
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                color="white"
                border="none"
                cursor="pointer"
                fontSize="large"
                width="max-content"
                padding="10px 15px"
                margin="5px"
                borderRadius="30px"
                backgroundColor="#0077cc"
                // className='button'
                onClick={() => setCurrentPage((prevPage) => prevPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {pageNumbers.map((pageNumber) => (
                <Button
                  color="white"
                  border="none"
                  cursor="pointer"
                  fontSize="large"
                  width="max-content"
                  padding="10px 15px"
                  margin="5px"
                  borderRadius="30px"
                  backgroundColor="#0077cc"
                  // className='button'
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={currentPage === pageNumber}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                color="white"
                border="none"
                cursor="pointer"
                fontSize="large"
                width="max-content"
                padding="10px 15px"
                margin="5px"
                borderRadius="30px"
                backgroundColor="#0077cc"
                // className='button'
                onClick={() => setCurrentPage((prevPage) => prevPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                c
                // className='button'
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </Box>
          ) : null}
        </Box>
      </Box>
      {/* footer */}
      <Box
        w="full"
        display="flex"
        justifyContent="space-between"
        color="gray.600"
        fontSize="sm"
        py={1}
        px={1}
        bg="light.50"
        borderTop="1px solid #d5d4d4"
        borderBottomColor="gray.200"
        textColor="gray.900"
        _dark={{
          bg: "dark.700",
          textColor: "gray.50",
          borderBottomColor: "dark.600",
        }}
        position="fixed"
        bottom="0"
      >
        <Box
          display="flex"
          alignItems="center"
          width="33%"
          flexDirection="column"
          onClick={viewAllFeeds}
          cursor="pointer"
        >
          {/* <Logo w={3.5} strokeWidth={1.8} />
        <Text ml={2}>© 2022 Grateape.</Text> */}
          <Image src={showData == "saved" ? "/home.svg" : "/homeYellow.svg"} width="auto" height="30px" margin="2px auto" />
          <Text display={{ sm: "block" }} fontWeight="bold">
            Home
          </Text>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          width="33%"
          flexDirection="column"
          onClick={viewSavedFeeds}
          cursor="pointer"
        >
          {/* <ThemeSwitcher button={compact} /> */}
          <Image src={ showData == "saved" ? "bookmarkYellow.png" : "/bookmark.png"} width="auto" height="25px" margin="4px auto" />
          <Text display={{ sm: "block" }} fontWeight="bold">
            Bookmarked
          </Text>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          width="33%"
          flexDirection="column"
          onClick={download}
          cursor="pointer"
        >
          {/* <ThemeSwitcher button={compact} /> */}
          <Image src="/download.svg" width="auto" height="30px" margin="2px auto" />
          <Text display={{ sm: "block" }} fontWeight="bold">
            Download
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default AllFeeds;
