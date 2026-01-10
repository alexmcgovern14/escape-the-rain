import svgPaths from "./svg-7py8y1em0n";
import clsx from "clsx";
type NotchNotchProps = {
  additionalClassNames?: string[];
};

function NotchNotch({
  children,
  additionalClassNames = [],
}: React.PropsWithChildren<NotchNotchProps>) {
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

function IconBasket() {
  return (
    <div className="absolute left-0 size-8 top-0" data-name="icon-basket">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 32 32"
      >
        <g id="icon-basket">
          <path d={svgPaths.p2003cd00} fill="var(--fill-0, black)" id="icon" />
        </g>
      </svg>
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
          <p className="block leading-[32px]">My Basket</p>
        </div>
        <button className="[white-space-collapse:collapse] cursor-pointer flex flex-col font-['Inter:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[#426b1f] text-[14px] text-nowrap tracking-[-0.14px]">
          <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">{`<- Back`}</p>
        </button>
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
    <NotchNotch additionalClassNames={["contents"]}>
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
    </NotchNotch>
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
      <Header />
      <StatusBar />
    </div>
  );
}