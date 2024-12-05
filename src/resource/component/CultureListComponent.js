const CultureListComponent = ({ culture }) => {
  return (
    <div className="border border-gray-200 rounded-md pb-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow duration-300 overflow-hidden">
      <div>
        <img
          src={culture.image_url || "https://via.placeholder.com/300x400"}
          alt={culture.title?._text || "이미지 없음"}
          className="w-full h-64 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">
          {culture.title?._text || "제목 정보 없음"}
        </h3>
        <p className="text-sm text-gray-600">
          {culture.place_nm?._text || "시설명 정보 없음"}
        </p>
        <p className="text-sm text-gray-500">
          {culture.op_st_dt?._text
            ? `시작일: ${culture.op_st_dt._text}`
            : "시작일 정보 없음"}
        </p>
        <p className="text-sm text-gray-500">
          {culture.op_ed_dt?._text
            ? `종료일: ${culture.op_ed_dt._text}`
            : "종료일 정보 없음"}
        </p>
        <p className="text-sm text-gray-500">
          {culture.pay_at?._text
            ? `입장료: ${culture.pay_at._text}`
            : "입장료 정보 없음"}
        </p>
      </div>
    </div>
  );
};
export default CultureListComponent;
