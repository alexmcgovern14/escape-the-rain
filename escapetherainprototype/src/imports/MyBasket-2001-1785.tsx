import svgPaths from "./svg-x4vilrsbuo";
import clsx from "clsx";
import imgRectangle6543 from "figma:asset/941aff148e69d99e908f044d27d961836c523499.png";
type NotchNotchBackgroundImageProps = {
  additionalClassNames?: string[];
};

function NotchNotchBackgroundImage({
  children,
  additionalClassNames = [],
}: React.PropsWithChildren<NotchNotchBackgroundImageProps>) {
  return (
    <div
      style={{ left: "calc(50% + 0.499992px)" }}
      className={clsx(
        "absolute top-[-2px] translate-x-[-50%]",
        additionalClassNames,
      )}
    >
      {children}
    </div>
  );
}
type BackgroundImage14Props = {
  additionalClassNames?: string[];
};

function BackgroundImage14({
  children,
  additionalClassNames = [],
}: React.PropsWithChildren<BackgroundImage14Props>) {
  return (
    <div className={clsx("absolute size-8", additionalClassNames)}>
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 32 32"
      >
        {children}
      </svg>
    </div>
  );
}
type Frame24BackgroundImageAndTextProps = {
  text: string;
};

function Frame24BackgroundImageAndText({
  text,
}: Frame24BackgroundImageAndTextProps) {
  return (
    <div className="flex flex-col justify-center mb-[-4px] relative shrink-0">
      <p className="adjustLetterSpacing block leading-[24px] text-nowrap whitespace-pre">
        {text}
      </p>
    </div>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
};

function BackgroundImageAndText({ text }: BackgroundImageAndTextProps) {
  return (
    <div
      style={{ fontVariationSettings: "'wdth' 100" }}
      className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] left-[-23.5px] text-[#ffffff] text-[16px] text-center text-nowrap top-[180px] translate-x-[-50%]"
    >
      <p className="block leading-[20px] whitespace-pre">{text}</p>
    </div>
  );
}

function Component1() {
  return (
    <div className="absolute contents left-[-40px] top-[174px]" data-name="1">
      <BackgroundImage14 additionalClassNames={["left-[-40px]", "top-[174px]"]}>
        <circle
          cx="16"
          cy="16"
          fill="var(--fill-0, #757575)"
          id="Ellipse 181"
          r="16"
        />
      </BackgroundImage14>
      <BackgroundImageAndText text="1" />
    </div>
  );
}

function Component2() {
  return (
    <div className="absolute contents left-[-40px] top-[174px]" data-name="2">
      <BackgroundImage14 additionalClassNames={["left-[-40px]", "top-[174px]"]}>
        <circle
          cx="16"
          cy="16"
          fill="var(--fill-0, #426B1F)"
          id="Ellipse 180"
          r="16"
        />
      </BackgroundImage14>
      <BackgroundImageAndText text="2" />
    </div>
  );
}

function LocationOn() {
  return (
    <div
      className="absolute left-[119px] size-[38px] top-[106px]"
      data-name="location_on"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 38 38"
      >
        <g id="location_on">
          <path
            d={svgPaths.p1a0ddf80}
            fill="var(--fill-0, #426B1F)"
            id="icon"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame26() {
  return (
    <div className="absolute h-[225px] left-[25px] overflow-auto top-[222px] w-[326px]">
      <div
        className="[background-size:auto,_cover] absolute bg-[0%_0%,_50%_50%] left-[-174px] size-[738px] top-[-273px]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), url('${imgRectangle6543}')`,
        }}
      />
      <LocationOn />
    </div>
  );
}

function Frame24() {
  return (
    <div className="absolute left-6 top-[492px]">
      <div className="box-border content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal items-start justify-start leading-[0] not-italic pb-1 pt-0 px-0 relative text-[#000000] text-[14px] text-left text-nowrap tracking-[-0.14px]">
        <Frame24BackgroundImageAndText text="Sho Kuwamoto" />
        <Frame24BackgroundImageAndText text="123 Quite Grove Rd." />
        <Frame24BackgroundImageAndText text="United States" />
        <Frame24BackgroundImageAndText text="California" />
        <Frame24BackgroundImageAndText text="90210" />
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div
      className="absolute top-[492px]"
      style={{ left: "calc(50% + 12.5px)" }}
    >
      <div className="box-border content-stretch flex flex-col items-start justify-start pb-1 pt-0 px-0 relative">
        <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] mb-[-4px] not-italic relative shrink-0 text-[#000000] text-[14px] text-left text-nowrap tracking-[-0.14px]">
          <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">
            Nov. 16, 2022
          </p>
        </div>
      </div>
    </div>
  );
}

function IconBasket() {
  return (
    <BackgroundImage14 additionalClassNames={["left-0", "top-0"]}>
      <g id="icon-basket">
        <path d={svgPaths.p2003cd00} fill="var(--fill-0, black)" id="icon" />
      </g>
    </BackgroundImage14>
  );
}

function Badge() {
  return (
    <div
      className="absolute bg-[#426b1f] left-[17px] rounded-lg size-4 top-[-1px]"
      data-name="Badge"
    >
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center px-0.5 py-px relative size-4">
          <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[12px] text-center text-nowrap tracking-[-0.12px]">
            <p className="adjustLetterSpacing block leading-none whitespace-pre">
              3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <div
      className="absolute right-5 rounded-2xl size-8 top-[18px]"
      data-name="Cart Icon"
    >
      <IconBasket />
      <Badge />
    </div>
  );
}

function Hamburger() {
  return (
    <div
      className="absolute h-1.5 left-[7px] top-[13px] w-[18px]"
      data-name="Hamburger"
    >
      <div className="absolute bottom-0 left-0 right-0 top-[-25%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 18 8"
        >
          <g id="Hamburger">
            <line
              id="Line 3"
              stroke="var(--stroke-0, black)"
              strokeWidth="1.5"
              x2="18"
              y1="1.25"
              y2="1.25"
            />
            <line
              id="Line 4"
              stroke="var(--stroke-0, black)"
              strokeWidth="1.5"
              x2="18"
              y1="7.25"
              y2="7.25"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <div
      className="absolute left-5 rounded-2xl size-8 top-[18px]"
      data-name="Menu Icon"
    >
      <Hamburger />
    </div>
  );
}

function MobileNav() {
  return (
    <div
      className="absolute bg-[#ffffff] h-16 left-0 overflow-clip right-0 top-[31px]"
      data-name="Mobile nav"
    >
      <div className="absolute bg-[#ffffff] h-[66px] left-0 top-0 w-[375px]" />
      <div
        className="absolute flex flex-col font-['Newsreader:Medium',_sans-serif] font-medium justify-center leading-[0] text-[#426b1f] text-[24px] text-center text-nowrap top-9 tracking-[-0.24px] translate-x-[-50%] translate-y-[-50%]"
        style={{ left: "calc(50% - 0.5px)" }}
      >
        <p className="adjustLetterSpacing block leading-none whitespace-pre">
          World Peas
        </p>
      </div>
      <CartIcon />
      <MenuIcon />
    </div>
  );
}

function SubNav() {
  return (
    <div className="relative shrink-0 w-full" data-name="Sub nav">
      <div className="box-border content-stretch flex flex-row font-normal items-center justify-start leading-[0] p-0 relative text-left w-full">
        <div className="basis-0 flex flex-col font-['Newsreader:Regular',_sans-serif] grow justify-center min-h-px min-w-px relative shrink-0 text-[#000000] text-[24px] tracking-[-0.48px]">
          <p className="block leading-[32px]">Confirmed</p>
        </div>
        <div className="flex flex-col font-['Inter:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[#426b1f] text-[14px] text-nowrap tracking-[-0.14px]">
          <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">{`<- Shop`}</p>
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  return (
    <div className="absolute left-6 right-6 top-[103px]" data-name="Top nav">
      <div className="box-border content-stretch flex flex-col gap-4 items-end justify-end p-0 relative w-full">
        <SubNav />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      className="absolute bg-[#ffffff] h-[149px] left-0 right-0 top-0"
      data-name="Header"
    >
      <div className="absolute border-[0px_0px_1px] border-neutral-200 border-solid inset-0 pointer-events-none shadow-[0px_0px_20px_0px_rgba(0,0,0,0.1)]" />
      <MobileNav />
      <TopNav />
    </div>
  );
}

function Notch() {
  return (
    <NotchNotchBackgroundImage additionalClassNames={["contents"]}>
      <div
        className="absolute h-[33px] top-[-2px] translate-x-[-50%] w-[156px]"
        data-name="Notch"
        style={{ left: "calc(50% + 0.499992px)" }}
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 156 33"
        >
          <g id="Notch">
            <path d={svgPaths.p28770100} fill="black" />
            <path d={svgPaths.p28f48b80} fill="var(--fill-0, black)" />
            <path d={svgPaths.p14d82600} fill="var(--fill-0, black)" />
          </g>
        </svg>
      </div>
    </NotchNotchBackgroundImage>
  );
}

function StatusBarTime() {
  return (
    <div
      className="absolute h-[21px] rounded-3xl top-3.5 translate-x-[-50%] w-[54px]"
      data-name="_StatusBar-time"
      style={{ left: "calc(50% - 135.5px)" }}
    >
      <div className="absolute css-a0byvc font-['SF_Pro_Display:Bold',_sans-serif] h-5 leading-[0] left-[27px] not-italic text-[#000000] text-[17px] text-center top-px tracking-[-0.408px] translate-x-[-50%] w-[54px]">
        <p className="adjustLetterSpacing block leading-[22px]">9:41</p>
      </div>
    </div>
  );
}

function LeftSide() {
  return (
    <div
      className="absolute contents left-[25px] top-3.5"
      data-name="Left Side"
    >
      <StatusBarTime />
    </div>
  );
}

function StatusBarBattery() {
  return (
    <div
      className="absolute h-[13px] top-[19px] translate-x-[-50%] w-[27.401px]"
      data-name="_StatusBar-battery"
      style={{ left: "calc(50% + 150.201px)" }}
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 28 13"
      >
        <g id="_StatusBar-battery">
          <path
            d={svgPaths.p3f827980}
            id="Outline"
            opacity="0.35"
            stroke="var(--stroke-0, black)"
          />
          <path
            d={svgPaths.p5fdc300}
            fill="var(--fill-0, black)"
            id="Battery End"
            opacity="0.4"
          />
          <path d={svgPaths.pbee4a00} fill="var(--fill-0, black)" id="Fill" />
        </g>
      </svg>
    </div>
  );
}

function RightSide() {
  return (
    <div
      className="absolute contents left-[274px] top-[19px]"
      data-name="Right Side"
    >
      <StatusBarBattery />
      <div
        className="absolute bottom-[32.269%] left-[80%] right-[15.467%] top-[42.553%]"
        data-name="Wifi"
      >
        <div className="absolute bottom-[-0.002%] left-0 right-0 top-[0.002%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 17 12"
          >
            <path
              d={svgPaths.p17a4bf30}
              fill="var(--fill-0, black)"
              id="Wifi"
            />
          </svg>
        </div>
      </div>
      <div
        className="absolute h-3 top-5 translate-x-[-50%] w-[18px]"
        data-name="Icon / Mobile Signal"
        style={{ left: "calc(50% + 95.5px)" }}
      >
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 18 12"
        >
          <g id="Icon / Mobile Signal">
            <path d={svgPaths.p1ec31400} fill="var(--fill-0, black)" />
            <path d={svgPaths.p19f8d480} fill="var(--fill-0, black)" />
            <path d={svgPaths.p13f4aa00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1bfb7500} fill="var(--fill-0, black)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div
      className="absolute h-[47px] left-0 overflow-clip right-0 top-0"
      data-name="StatusBar"
    >
      <Notch />
      <LeftSide />
      <RightSide />
    </div>
  );
}

export default function MyBasket() {
  return (
    <div className="bg-[#ffffff] relative size-full" data-name="My Basket">
      <Component1 />
      <Component2 />
      <div className="absolute h-0 left-6 right-6 top-[222px]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 327 1"
          >
            <line
              id="Line 7"
              stroke="var(--stroke-0, #E5E5E5)"
              x2="327"
              y1="0.5"
              y2="0.5"
            />
          </svg>
        </div>
      </div>
      <Frame26 />
      <Frame24 />
      <Frame25 />
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-6 not-italic text-[#757575] text-[14px] text-left text-nowrap top-[474px] tracking-[-0.14px] translate-y-[-50%]">
        <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">
          Delivery to
        </p>
      </div>
      <div
        className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic text-[#757575] text-[14px] text-left text-nowrap top-[474px] tracking-[-0.14px] translate-y-[-50%]"
        style={{ left: "calc(50% + 12.5px)" }}
      >
        <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">
          Estimated delivery
        </p>
      </div>
      <div className="absolute flex flex-col font-['Newsreader:Regular',_sans-serif] font-normal justify-center leading-[0] left-[25px] text-[#426b1f] text-[24px] text-left text-nowrap top-[190px] tracking-[-0.48px] translate-y-[-50%]">
        <p className="adjustLetterSpacing block leading-[32px] whitespace-pre">
          Your order is being prepared
        </p>
      </div>
      <Header />
      <StatusBar />
    </div>
  );
}