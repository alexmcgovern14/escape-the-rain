import svgPaths from "./svg-swumbxuqgn";
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

function Textinput({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative w-full">
        {children}
      </div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string[];
};

function Wrapper1({
  children,
  additionalClassNames = [],
}: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("size-8", additionalClassNames)}>
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

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative w-full">
        {children}
      </div>
    </div>
  );
}

function Input6({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[#ffffff] relative rounded-lg shrink-0 w-full">
      <div className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-4 py-3 relative w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <Wrapper>
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#000000] text-[16px] text-left tracking-[-0.16px]">
        <p className="block leading-[24px]">{text}</p>
      </div>
      <div className="flex h-[4px] items-center justify-center relative shrink-0 w-[7px]">
        <div className="flex-none rotate-[90deg]">
          <div className="h-[7px] relative w-[3.5px]">
            <div className="absolute bottom-[-5.051%] left-[-10.101%] right-[-20.203%] top-[-5.051%]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 6 9"
              >
                <path
                  d="M1 1L4.5 4.5L1 8"
                  id="Vector 27"
                  stroke="var(--stroke-0, black)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <Wrapper>
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#000000] text-[16px] text-left tracking-[-0.16px]">
        <p className="block leading-[24px]">{text}</p>
      </div>
    </Wrapper>
  );
}

function Helper() {
  return (
    <svg
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      className="block size-full"
    >
      <circle
        cx="16"
        cy="16"
        fill="var(--fill-0, #757575)"
        id="Ellipse 181"
        r="16"
      />
    </svg>
  );
}

function Component1() {
  return (
    <div className="absolute contents left-6 top-[174px]" data-name="1">
      <Wrapper1 additionalClassNames={["absolute", "left-6", "top-[174px]"]}>
        <circle
          cx="16"
          cy="16"
          fill="var(--fill-0, #426B1F)"
          id="Ellipse 180"
          r="16"
        />
      </Wrapper1>
      <div
        className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] left-[40.5px] text-[#ffffff] text-[16px] text-center text-nowrap top-[180px] translate-x-[-50%]"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        <p className="block leading-[20px] whitespace-pre">1</p>
      </div>
    </div>
  );
}

function Component2() {
  return (
    <div
      className="absolute contents top-[174px]"
      data-name="2"
      style={{ left: "calc(50% + 93.5px)" }}
    >
      <div
        className="absolute size-8 top-[174px]"
        style={{ left: "calc(50% + 93.5px)" }}
      >
        <Helper />
      </div>
      <div
        className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] text-[#ffffff] text-[16px] text-center text-nowrap top-[180px] translate-x-[-50%]"
        style={{
          fontVariationSettings: "'wdth' 100",
          left: "calc(50% + 110px)",
        }}
      >
        <p className="block leading-[20px] whitespace-pre">2</p>
      </div>
    </div>
  );
}

function Component3() {
  return (
    <div
      className="absolute contents top-[174px]"
      data-name="3"
      style={{ left: "calc(50% + 131.5px)" }}
    >
      <div
        className="absolute size-8 top-[174px]"
        style={{ left: "calc(50% + 131.5px)" }}
      >
        <Helper />
      </div>
      <div
        className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] text-[#ffffff] text-[16px] text-center text-nowrap top-[180px] translate-x-[-50%]"
        style={{
          fontVariationSettings: "'wdth' 100",
          left: "calc(50% + 148px)",
        }}
      >
        <p className="block leading-[20px] whitespace-pre">3</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <Input6>
      <Text text="Sho Kuwamoto" />
    </Input6>
  );
}

function TextInput() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">Full name</p>
      </div>
      <Input />
    </Textinput>
  );
}

function Input1() {
  return (
    <Input6>
      <Text text="123 Quiet Grove Rd." />
    </Input6>
  );
}

function TextInput1() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">Address line 1</p>
      </div>
      <Input1 />
    </Textinput>
  );
}

function Frame15() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 w-full" />
    </div>
  );
}

function Input2() {
  return (
    <Input6>
      <Frame15 />
    </Input6>
  );
}

function TextInput2() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">Address line 2</p>
      </div>
      <Input2 />
    </Textinput>
  );
}

function Input3() {
  return (
    <Input6>
      <Text1 text="United States" />
    </Input6>
  );
}

function TextInput3() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">Country</p>
      </div>
      <Input3 />
    </Textinput>
  );
}

function Input4() {
  return (
    <Input6>
      <Text1 text="California" />
    </Input6>
  );
}

function TextInput4() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">State</p>
      </div>
      <Input4 />
    </Textinput>
  );
}

function Input5() {
  return (
    <Input6>
      <Text text="90210" />
    </Input6>
  );
}

function TextInput5() {
  return (
    <Textinput>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
        <p className="block leading-[24px]">Zip Code</p>
      </div>
      <Input5 />
    </Textinput>
  );
}

function Frame22() {
  return (
    <div className="absolute left-6 right-6 top-[286px]">
      <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative w-full">
        <TextInput />
        <TextInput1 />
        <TextInput2 />
        <TextInput3 />
        <TextInput4 />
        <TextInput5 />
      </div>
    </div>
  );
}

function ShippingContent() {
  return (
    <div
      className="absolute contents left-6 top-[246px]"
      data-name="shipping content"
    >
      <Frame22 />
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-6 not-italic text-[#000000] text-[16px] text-left text-nowrap top-[258px] translate-y-[-50%]">
        <p className="block leading-[1.5] whitespace-pre">
          The address your order will ship to
        </p>
      </div>
    </div>
  );
}

function IconForward() {
  return (
    <Wrapper1 additionalClassNames={["relative", "shrink-0"]}>
      <g id="icon-forward">
        <path d={svgPaths.p3d7c1f80} fill="var(--fill-0, white)" id="icon" />
      </g>
    </Wrapper1>
  );
}

function Button() {
  return (
    <div
      className="absolute bg-neutral-200 left-6 right-6 rounded-lg top-6"
      data-name="Button"
    >
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start pl-6 pr-4 py-2 relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#ffffff] text-[16px] text-left tracking-[-0.16px]">
            <p className="block leading-[24px]">Proceed to payment</p>
          </div>
          <IconForward />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      className="absolute bg-[#ffffff] bottom-0 h-[124px] left-0 overflow-clip right-0 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.1)]"
      data-name="Footer"
    >
      <Button />
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-6 not-italic opacity-[0.001] text-[#426b1f] text-[14px] text-left text-nowrap top-[94px] tracking-[-0.14px] translate-y-[-50%]">
        <p className="leading-[24px] whitespace-pre">
          <span className="font-['Inter:Bold',_sans-serif] font-bold not-italic text-[#426b1f]">{`Hooray! `}</span>
          <span className="adjustLetterSpacing text-[#757575]">
            You qualify for free shipping
          </span>
        </p>
      </div>
    </div>
  );
}

function IconBasket() {
  return (
    <Wrapper1 additionalClassNames={["absolute", "left-0", "top-0"]}>
      <g id="icon-basket">
        <path d={svgPaths.p2003cd00} fill="var(--fill-0, black)" id="icon" />
      </g>
    </Wrapper1>
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
          <p className="block leading-[32px]">Checkout</p>
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
      <Component1 />
      <Component2 />
      <Component3 />
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
      <ShippingContent />
      <div className="absolute flex flex-col font-['Newsreader:Regular',_sans-serif] font-normal justify-center leading-[0] left-[72px] text-[#426b1f] text-[24px] text-left top-[190px] tracking-[-0.48px] translate-y-[-50%] w-[138.5px]">
        <p className="adjustLetterSpacing block leading-[32px]">Shipping</p>
      </div>
      <Footer />
      <Header />
      <StatusBar />
    </div>
  );
}