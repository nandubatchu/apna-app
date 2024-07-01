import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/Tabs";
import { Skeleton } from "@/components/atoms/skeleton";
import {
  MdHomeFilled,
  MdNotifications,
  MdSearch,
  MdEmail,
  MdFace4,
  MdSettings
} from "react-icons/md";
import {
  Drawer,
  DrawerClose,
  DrawerPortal,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/atoms/drawer";
import { Header } from "@/components/organisms/header";
import { Feed } from "@/components/molecules/feed";
import ButtonIcon from "@/components/molecules/ButtonIcon";

const config = {
  tabs: [
    {
      icon: "",
      content: "",
    },
  ],
};

export default function Home() {
  return (
    <>
      <ButtonIcon className="fixed bottom-[60px] right-[10px]"></ButtonIcon>
      <Drawer direction="left">
        <Header>
          <DrawerTrigger>
            <MdFace4 size={25} className="m-2"></MdFace4>
          </DrawerTrigger>
          <div className="font-semibold">Apna Social</div>
          <MdSettings size={25} className="m-2"></MdSettings>
        </Header>

        <DrawerPortal>
          <DrawerContent className="bg-white flex flex-col rounded-[0px] h-full w-[300px] mt-24 fixed bottom-0 right-0">
            <DrawerHeader>
              <DrawerTitle>Are you absolutely sure?</DrawerTitle>
              <DrawerDescription>
                This action cannot be undone.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <button>Submit</button>
              <DrawerClose>
                <button>Cancel</button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>

      <Tabs defaultValue="feed" className="w-full top-0">
        <TabsContent value="feed" className="m-0">
          {/* <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[250px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </div> */}
          <Feed></Feed>
        </TabsContent>
        <TabsContent value="search">Search</TabsContent>
        <TabsContent value="notifications">Notifications!</TabsContent>
        <TabsContent value="messages">Messsages</TabsContent>
        <TabsList className="w-full h-[50px] justify-evenly fixed bottom-0 left-0 z-50">
          <TabsTrigger value="feed">
            <MdHomeFilled size={25}></MdHomeFilled>
          </TabsTrigger>
          <TabsTrigger value="search">
            <MdSearch size={25}></MdSearch>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MdNotifications size={25}></MdNotifications>
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MdEmail size={25}></MdEmail>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}
