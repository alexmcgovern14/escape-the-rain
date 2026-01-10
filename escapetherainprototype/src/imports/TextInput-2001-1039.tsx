function Frame13() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative w-full">
        <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#000000] text-[16px] text-left tracking-[-0.16px]">
          <p className="block leading-[24px]">United States</p>
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
      </div>
    </div>
  );
}

function Input() {
  return (
    <div
      className="bg-[#ffffff] relative rounded-lg shrink-0 w-full"
      data-name="Input"
    >
      <div className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-4 py-3 relative w-full">
          <Frame13 />
        </div>
      </div>
    </div>
  );
}

export default function TextInput() {
  return (
    <div className="relative size-full" data-name="Text Input">
      <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative size-full">
        <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#757575] text-[14px] text-left tracking-[-0.14px] w-full">
          <p className="block leading-[24px]">Country</p>
        </div>
        <Input />
      </div>
    </div>
  );
}